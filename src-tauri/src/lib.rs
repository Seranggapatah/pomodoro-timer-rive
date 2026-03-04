use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager, WebviewWindowBuilder,
};

// ── Icon renderer ─────────────────────────────────────────────────────────────
const SZ: u32 = 22;

fn render_dot(mode: &str, is_active: bool) -> Vec<u8> {
    let (r, g, b): (u8, u8, u8) = match (mode, is_active) {
        ("focus", true)  => (255, 69, 69),
        ("focus", false) => (255, 204, 0),
        (_, true)        => (52, 199, 89),
        (_, false)       => (142, 142, 147),
    };

    let mut buf = vec![0u8; (SZ * SZ * 4) as usize];
    let cx = SZ as f32 / 2.0;
    let cy = SZ as f32 / 2.0;
    let radius = SZ as f32 / 2.0 - 1.5;

    for y in 0..SZ {
        for x in 0..SZ {
            let dx = x as f32 - cx + 0.5;
            let dy = y as f32 - cy + 0.5;
            let dist = (dx * dx + dy * dy).sqrt();
            let alpha = if dist <= radius - 1.0 {
                255u8
            } else if dist <= radius {
                ((radius - dist) * 255.0) as u8
            } else {
                0u8
            };
            if alpha > 0 {
                let i = ((y * SZ + x) * 4) as usize;
                buf[i]     = r;
                buf[i + 1] = g;
                buf[i + 2] = b;
                buf[i + 3] = alpha;
            }
        }
    }
    buf
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Minimal percent-decoder for URL query strings.
fn percent_decode(s: &str) -> String {
    let s = s.replace('+', " ");
    let mut out = String::with_capacity(s.len());
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(hex) = u8::from_str_radix(
                std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""),
                16,
            ) {
                out.push(hex as char);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i] as char);
        i += 1;
    }
    out
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Fetch SlabPixel tracker data via on_navigation interception.
///
/// IPC flow:
///   JS → window.location.href = 'pomotchi-ipc://tracker?...'
///   → on_navigation callback fires (WKWebView navigation policy delegate)
///   → Rust parses params, emits 'tracker-data' event, returns false (blocks nav)
///
/// Why not fetch()? fetch() is covered by CSP connect-src.
/// Why not __TAURI_INTERNALS__? Not injected into external WebViews.
/// window.location.href navigation bypasses connect-src — it's a navigation, not a request.
#[tauri::command]
async fn fetch_tracker_data(app: tauri::AppHandle) -> Result<(), String> {
    const WIN_ID: &str = "tracker-scraper";
    const URL: &str = "https://app.slabpixel.com/dashboard";
    const SELECTOR: &str = "body > div > header > div.w-full.px-4.flex.flex-row.gap-4.items-center.py-4 > div.flex.items-center.justify-end.gap-2.w-fit > div > div";

    println!("[tracker] fetch_tracker_data called");

    if app.get_webview_window(WIN_ID).is_none() {
        println!("[tracker] creating new WebviewWindow (on_navigation IPC)");
        let app_nav = app.clone();

        WebviewWindowBuilder::new(
            &app,
            WIN_ID,
            tauri::WebviewUrl::External(URL.parse().unwrap()),
        )
        .title("SlabPixel Tracker")
        .visible(false)
        .inner_size(1200.0, 800.0)
        .on_navigation(move |url| {
            let url_str = url.to_string();

            // Let all real navigations through (login redirects, etc.)
            if !url_str.starts_with("pomotchi-ipc://") {
                return true;
            }

            println!("[tracker-nav] *** INTERCEPTED *** {}", &url_str[..url_str.len().min(400)]);

            let query = url_str.splitn(2, '?').nth(1).unwrap_or("");
            let mut time_val: Option<String> = None;
            let mut found = false;
            let mut paused = false;
            let mut stopped = false;
            let mut page_url = String::new();
            let mut page_title = String::new();

            for pair in query.split('&') {
                let mut kv = pair.splitn(2, '=');
                let k = kv.next().unwrap_or("");
                let v = kv.next().unwrap_or("");
                let v_dec = percent_decode(v);
                match k {
                    "time"    => { if !v_dec.is_empty() { time_val = Some(v_dec); } }
                    "found"   => { found  = v == "1"; }
                    "paused"  => { paused = v == "1"; }
                    "stopped" => { stopped = v == "1"; }
                    "url"     => { page_url = v_dec; }
                    "title"   => { page_title = v_dec; }
                    _ => {}
                }
            }

            println!("[tracker-nav] page='{}' url='{}' found={} paused={} stopped={} time={:?}",
                page_title, page_url, found, paused, stopped, time_val);

            let payload = if found && time_val.is_some() {
                println!("[tracker-nav] ✅ success: {:?} paused={} stopped={}", time_val, paused, stopped);
                serde_json::json!({ "time": time_val, "paused": paused, "stopped": stopped, "error": null })
            } else {
                let err = format!(
                    "Not found on '{}'. Make sure you are logged in to SlabPixel.",
                    if page_url.is_empty() { "unknown".to_string() } else { page_url }
                );
                println!("[tracker-nav] ❌ {}", err);
                serde_json::json!({ "time": null, "paused": false, "stopped": false, "error": err })
            };

            let _ = app_nav.emit("tracker-data", payload);
            false // cancel the navigation — page stays put
        })
        .build()
        .map_err(|e| e.to_string())?;

    } else {
        println!("[tracker] reusing existing window");
    }

    let win = app
        .get_webview_window(WIN_ID)
        .ok_or_else(|| "tracker window gone".to_string())?;

    // ── Scraper JS ─────────────────────────────────────────────────────────────
    // Two strategies:
    //   1. Try the known CSS selector
    //   2. Scan all text nodes for HH:MM:SS / MM:SS pattern (auto-detect)
    // Uses window.location.href = 'pomotchi-ipc://...' — bypasses CSP connect-src.
    let selector = SELECTOR.replace('"', "\\\"");
    let script = format!(
        r#"(function() {{
          var SEL = "{selector}";

          function sendResult(text, found, state) {{
            var params = [
              'time='   + encodeURIComponent(text  || ''),
              'found='  + (found  ? '1' : '0'),
              'paused=' + (state.paused ? '1' : '0'),
              'stopped='+ (state.stopped ? '1' : '0'),
              'url='    + encodeURIComponent(window.location.href),
              'title='  + encodeURIComponent(document.title)
            ].join('&');
            console.log('[pomotchi] sendResult found=' + found + ' paused=' + state.paused + ' stopped=' + state.stopped + ' text=' + text);
            window.location.href = 'pomotchi-ipc://tracker?' + params;
          }}

          function getTimerState() {{
            var btns = Array.from(document.querySelectorAll('button'));
            var hasStart = btns.some(function(b) {{ return /^\s*start\s*$/i.test(b.innerText); }});
            if (hasStart) return {{ stopped: true, paused: false }};
            var hasResume = btns.some(function(b) {{ return /^\s*resume\s*$/i.test(b.innerText); }});
            var hasPause  = btns.some(function(b) {{ return /^\s*pause\s*$/i.test(b.innerText);  }});
            return {{ stopped: false, paused: hasResume || !hasPause }};
          }}

          function scrape() {{
            var timeRe = /\b(\d{{1,2}}:\d{{2}}:\d{{2}})\b/;
            var state = getTimerState();
            var textFound = '';
            var isFound = false;

            // Strategy 1: user-provided CSS selector — extract time via regex from its text
            var el = document.querySelector(SEL);
            var rawText = el ? (el.innerText || el.textContent || '') : '';
            var m1 = rawText.match(timeRe);
            if (m1) {{
              textFound = m1[1];
              isFound = true;
            }} else {{
              // Strategy 2: scan all text nodes for time pattern HH:MM:SS
              var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
              var node;
              while ((node = walker.nextNode())) {{
                var t = (node.textContent || '').trim();
                var m2 = t.match(timeRe);
                if (m2) {{
                  textFound = m2[1];
                  isFound = true;
                  break;
                }}
              }}
            }}

            if (isFound) {{
              var payloadHash = textFound + '|' + state.stopped + '|' + state.paused;
              if (window.__pomotchiLastPayload !== payloadHash) {{
                window.__pomotchiLastPayload = payloadHash;
                console.log('[pomotchi] state changed ->', payloadHash);
                sendResult(textFound, true, state);
              }}
            }} else {{
              if (window.__pomotchiLastPayload !== 'not_found') {{
                window.__pomotchiLastPayload = 'not_found';
                console.log('[pomotchi] not found on', window.location.href);
                sendResult('', false, {{ stopped: false, paused: false }});
              }}
            }}
          }}

          // Run once immediately, then repeatedly
          function start() {{
            scrape();
            // Guard: only one interval per window
            if (!window.__pomotchiInterval) {{
              window.__pomotchiInterval = setInterval(scrape, 500);
              console.log('[pomotchi] interval started (500ms)');
            }}
          }}

          if (document.readyState === 'complete' || document.readyState === 'interactive') {{
            setTimeout(start, 1500);
          }} else {{
            window.addEventListener('load', function() {{ setTimeout(start, 1500); }}, {{ once: true }});
          }}
        }})();
        "#,
        selector = selector
    );

    println!("[tracker] injecting scraper JS");
    win.eval(&script).map_err(|e| e.to_string())?;
    Ok(())
}

/// Shows the tracker window so user can log in to SlabPixel's session.
#[tauri::command]
async fn show_tracker_login(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("tracker-scraper") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
    } else {
        // If window doesn't exist yet, fetch_tracker_data will create it (visible)
        fetch_tracker_data(app).await?;
    }
    Ok(())
}

/// Clicks the Pause/Resume button on the SlabPixel tracker page.
#[tauri::command]
async fn pause_tracker_timer(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("tracker-scraper")
        .ok_or_else(|| "Tracker not running. Click Refresh first.".to_string())?;
    win.eval(r#"
        (function() {
            var btns = Array.from(document.querySelectorAll('button'));
            // Click Resume if paused, otherwise click Pause
            var btn = btns.find(function(b) { return /^\s*(pause|resume)\s*$/i.test(b.innerText); });
            if (btn) { btn.click(); console.log('[pomotchi] clicked:', btn.innerText.trim()); }
            else { console.warn('[pomotchi] pause/resume button not found'); }
        })();
    "#).map_err(|e| e.to_string())
}

/// Clicks the Start button on the SlabPixel tracker page.
#[tauri::command]
async fn start_tracker_timer(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("tracker-scraper")
        .ok_or_else(|| "Tracker not running. Click Refresh first.".to_string())?;
    win.eval(r#"
        (function() {
            var allBtns = Array.from(document.querySelectorAll('button'));
            var startBtn = allBtns.find(function(b) {
                return /^\s*start\s*$/i.test(b.innerText);
            });
            if (startBtn) {
                startBtn.click();
                console.log('[pomotchi] clicked: Start');
            } else {
                console.warn('[pomotchi] start button not found');
            }
        })();
    "#).map_err(|e| e.to_string())
}

/// Clicks the initial Stop button on SlabPixel to open its confirm dialog.
#[tauri::command]
async fn initiate_stop_tracker(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("tracker-scraper")
        .ok_or_else(|| "Tracker not running. Click Refresh first.".to_string())?;
    win.eval(r#"
        (function() {
            var allBtns = Array.from(document.querySelectorAll('button'));
            var stopBtn = allBtns.find(function(b) {
                // Use class hints: h-7 and bg-red-500 is the first Stop button
                return typeof b.className === 'string' && b.className.includes('bg-red-500') && b.className.includes('h-7');
            });
            if (!stopBtn) {
                // Fallback to old textual matching, ensuring it's not inside the popup (z-50)
                stopBtn = allBtns.find(function(b) {
                    return /^\s*stop\s*$/i.test(b.innerText) && !b.closest('.z-50');
                });
            }
            if (stopBtn) {
                stopBtn.click();
                console.log('[pomotchi] clicked: initial Stop');
            } else {
                console.warn('[pomotchi] initial stop button not found');
            }
        })();
    "#).map_err(|e| e.to_string())
}

/// Clicks the confirmation button in the SlabPixel popup.
#[tauri::command]
async fn confirm_stop_tracker(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("tracker-scraper")
        .ok_or_else(|| "Tracker not running. Click Refresh first.".to_string())?;
    win.eval(r#"
        (function() {
            var allBtns = Array.from(document.querySelectorAll('button'));
            var confirmBtn = allBtns.find(function(b) {
                // Use class hints: h-9 and bg-red-500 is the second popup Stop button
                return typeof b.className === 'string' && b.className.includes('bg-red-500') && b.className.includes('h-9');
            });
            if (!confirmBtn) {
                // Fallback: look specifically inside the popup container (.z-50)
                var popup = document.querySelector('.fixed.z-50, [role="dialog"]');
                if (popup) {
                    confirmBtn = popup.querySelector('button.bg-red-500');
                }
            }
            if (confirmBtn) {
                confirmBtn.click();
                console.log('[pomotchi] clicked: Confirm Stop');
            } else {
                console.warn('[pomotchi] confirm stop button not found');
            }
        })();
    "#).map_err(|e| e.to_string())
}

/// Clicks the Cancel button in the SlabPixel popup.
#[tauri::command]
async fn cancel_stop_tracker(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("tracker-scraper")
        .ok_or_else(|| "Tracker not running. Click Refresh first.".to_string())?;
    win.eval(r#"
        (function() {
            var popup = document.querySelector('.fixed.z-50, [role="dialog"]');
            var cancelBtn = null;
            if (popup) {
                var btns = Array.from(popup.querySelectorAll('button'));
                cancelBtn = btns.find(function(b) {
                    // Usually Cancel button is not red
                    return !b.className.includes('bg-red-500') || /cancel/i.test(b.innerText);
                });
            } else {
                var allBtns = Array.from(document.querySelectorAll('button'));
                cancelBtn = allBtns.find(function(b) { return /^\s*cancel\s*$/i.test(b.innerText); });
            }
            if (cancelBtn) {
                cancelBtn.click();
                console.log('[pomotchi] clicked: Cancel Stop');
            }
        })();
    "#).map_err(|e| e.to_string())
}

/// Hides the tracker window.
#[tauri::command]
async fn hide_tracker_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("tracker-scraper") {
        w.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn update_tray_tooltip(app: tauri::AppHandle, tooltip: String) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}

#[tauri::command]
fn update_tray_timer(app: tauri::AppHandle, time_string: String, mode: String, is_active: bool) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let rgba = render_dot(&mode, is_active);
        let img = Image::new_owned(rgba, SZ, SZ);
        let _ = tray.set_icon(Some(img));

        let emoji = if mode == "focus" { "🍅" } else { "☕" };
        let label = if mode == "focus" { "Focus" } else { "Break" };
        let status = if is_active { "Running" } else { "Paused" };
        let tip = format!("{} {} — {} ({})", emoji, label, time_string, status);
        let _ = tray.set_tooltip(Some(&tip));
    }

    let play_label = if is_active { "⏸  Pause" } else { "▶  Start" };
    let emoji = if mode == "focus" { "🍅" } else { "☕" };
    let mode_label = if mode == "focus" { "Focus" } else { "Break" };
    let status_text = format!("{} {} — {}", emoji, mode_label, time_string);

    let _ = app.emit(
        "tray-update",
        serde_json::json!({
            "status":    status_text,
            "playLabel": play_label,
        }),
    );
}

// ── App setup ─────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            update_tray_tooltip,
            update_tray_timer,
            fetch_tracker_data,
            show_tracker_login,
            hide_tracker_window,
            pause_tracker_timer,
            start_tracker_timer,
            initiate_stop_tracker,
            confirm_stop_tracker,
            cancel_stop_tracker,
        ])
        .setup(|app| {
            let status = MenuItemBuilder::with_id("status", "🍅 Focus — 25:00").build(app)?;
            let toggle = MenuItemBuilder::with_id("toggle", "▶  Start").build(app)?;
            let skip   = MenuItemBuilder::with_id("skip",   "⏭  Skip Session").build(app)?;
            let sep1   = tauri::menu::PredefinedMenuItem::separator(app)?;
            let show   = MenuItemBuilder::with_id("show",   "🔲 Show Window").build(app)?;
            let sep2   = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit   = MenuItemBuilder::with_id("quit",   "✕  Quit").build(app)?;

            let menu = MenuBuilder::new(app)
                .item(&status)
                .item(&toggle)
                .item(&skip)
                .item(&sep1)
                .item(&show)
                .item(&sep2)
                .item(&quit)
                .build()?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("🍅 Pomotchi")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "toggle" => { let _ = app.emit("tray-toggle", ()); }
                    "skip"   => { let _ = app.emit("tray-skip", ()); }
                    "quit"   => { app.exit(0); }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            #[cfg(target_os = "macos")]
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_visible_on_all_workspaces(true);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
