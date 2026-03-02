use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

// ── Icon renderer ─────────────────────────────────────────────────────────────
// Renders a 22×22 filled circle with anti-aliased edges.
// Colour meaning:
//   🔴 Red    (#FF4545)  — Focus, timer running
//   🟡 Yellow (#FFCC00)  — Focus, timer paused
//   🟢 Green  (#34C759)  — Break, timer running
//   ⚫ Gray   (#8E8E93)  — Break, timer paused

const SZ: u32 = 22; // macOS menu-bar icon standard size

fn render_dot(mode: &str, is_active: bool) -> Vec<u8> {
    let (r, g, b): (u8, u8, u8) = match (mode, is_active) {
        ("focus", true) => (255, 69, 69),  // red
        ("focus", false) => (255, 204, 0), // yellow
        (_, true) => (52, 199, 89),        // green
        (_, false) => (142, 142, 147),     // gray
    };

    let mut buf = vec![0u8; (SZ * SZ * 4) as usize];
    let cx = SZ as f32 / 2.0;
    let cy = SZ as f32 / 2.0;
    let radius = SZ as f32 / 2.0 - 1.5; // slight inset so edges look clean

    for y in 0..SZ {
        for x in 0..SZ {
            let dx = x as f32 - cx + 0.5;
            let dy = y as f32 - cy + 0.5;
            let dist = (dx * dx + dy * dy).sqrt();

            // Simple anti-alias: full alpha inside, fade on the edge pixel
            let alpha = if dist <= radius - 1.0 {
                255u8
            } else if dist <= radius {
                ((radius - dist) * 255.0) as u8
            } else {
                0u8
            };

            if alpha > 0 {
                let i = ((y * SZ + x) * 4) as usize;
                buf[i] = r;
                buf[i + 1] = g;
                buf[i + 2] = b;
                buf[i + 3] = alpha;
            }
        }
    }
    buf
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn update_tray_tooltip(app: tauri::AppHandle, tooltip: String) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}

#[tauri::command]
fn update_tray_timer(app: tauri::AppHandle, time_string: String, mode: String, is_active: bool) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        // Update dot icon
        let rgba = render_dot(&mode, is_active);
        let img = Image::new_owned(rgba, SZ, SZ);
        let _ = tray.set_icon(Some(img));

        // Update tooltip with full info
        let emoji = if mode == "focus" { "🍅" } else { "☕" };
        let label = if mode == "focus" { "Focus" } else { "Break" };
        let status = if is_active { "Running" } else { "Paused" };
        let tip = format!("{} {} — {} ({})", emoji, label, time_string, status);
        let _ = tray.set_tooltip(Some(&tip));
    }

    // Emit event for menu item updates
    let play_label = if is_active {
        "⏸  Pause"
    } else {
        "▶  Start"
    };
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
        ])
        .setup(|app| {
            let status = MenuItemBuilder::with_id("status", "🍅 Focus — 25:00").build(app)?;
            let toggle = MenuItemBuilder::with_id("toggle", "▶  Start").build(app)?;
            let skip = MenuItemBuilder::with_id("skip", "⏭  Skip Session").build(app)?;
            let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let show = MenuItemBuilder::with_id("show", "🔲 Show Window").build(app)?;
            let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit = MenuItemBuilder::with_id("quit", "✕  Quit").build(app)?;

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
                    "toggle" => {
                        let _ = app.emit("tray-toggle", ());
                    }
                    "skip" => {
                        let _ = app.emit("tray-skip", ());
                    }
                    "quit" => {
                        app.exit(0);
                    }
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

            // Agar app terlihat di semua macOS Spaces / Desktop
            #[cfg(target_os = "macos")]
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_visible_on_all_workspaces(true);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
