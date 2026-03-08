import './YearProgress.css';

export function YearProgress() {
    const now = new Date();
    const year = now.getFullYear();

    // Calculate total days in current year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;

    // Calculate days passed
    const startOfYear = new Date(year, 0, 1);
    const diffTime = now.getTime() - startOfYear.getTime();
    const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="year-progress">
            <div className="year-progress-header">
                <span className="year-progress-title">&gt; year_progress {year}</span>
                <span className="year-progress-stats">{passedDays}/{totalDays} days</span>
            </div>

            <div className="year-progress-grid">
                {Array.from({ length: totalDays }).map((_, i) => {
                    const isPassed = i < passedDays;
                    const isToday = i === passedDays - 1;

                    let boxClass = "yp-box remaining";
                    if (isToday) boxClass = "yp-box today";
                    else if (isPassed) boxClass = "yp-box passed";

                    return (
                        <div
                            key={i}
                            className={boxClass}
                            title={`Day ${i + 1}`}
                        />
                    );
                })}
            </div>

            <div className="year-progress-footer">
                <div className="yp-legend">
                    <span className="yp-legend-item"><div className="yp-box passed" /> passed</span>
                    <span className="yp-legend-item"><div className="yp-box remaining" /> remaining</span>
                </div>
                <span className="yp-percent">{Math.round((passedDays / totalDays) * 100)}% complete</span>
            </div>
        </div>
    );
}
