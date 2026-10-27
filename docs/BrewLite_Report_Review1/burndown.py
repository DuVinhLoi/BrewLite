"""Draw the BrewLite burndown from git history.

A task counts as done on the author date of its member commit (table in
section 4 of main.tex). The ideal line falls evenly from the first commit
of the repo to the Review 1 date. Style follows section 2.4 of the brief:
ideal #007049, actual #d32f2f.

Run from the repo root: python docs/BrewLite_Report_Review1/burndown.py
"""
import datetime as dt
import pathlib
import subprocess

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt

TASK_COMMIT = {
    1: "44e3784", 2: "a358930", 3: "9ea0933", 4: "32831dc", 5: "9ea0933",
    6: "44e3784", 7: "32831dc", 8: "bd1adc3", 9: "ed2e4ee", 10: "bd1adc3",
}
START_COMMIT = "0d022c0"  # first commit of the repo
REVIEW_DATE = dt.date(2026, 10, 23)
OUT = pathlib.Path(__file__).with_name("figures") / "burndown.png"


def author_date(rev: str) -> dt.date:
    out = subprocess.run(
        ["git", "show", "-s", "--format=%ad", "--date=short", rev],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    return dt.date.fromisoformat(out)


def main() -> None:
    done = {task: author_date(rev) for task, rev in TASK_COMMIT.items()}
    start = author_date(START_COMMIT)
    days = [start + dt.timedelta(d) for d in range((REVIEW_DATE - start).days + 1)]
    total = len(TASK_COMMIT)
    actual = [total - sum(d <= day for d in done.values()) for day in days]
    span = len(days) - 1
    ideal = [total - total * i / span for i in range(len(days))]

    for day, left in zip(days, actual):
        print(day.strftime("%d/%m"), left)

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
    ink, muted, grid = "#1f1f1f", "#5f5f5f", "#e4e4e2"

    ax.plot(days, ideal, color="#007049", linewidth=2, linestyle=(0, (6, 4)),
            solid_capstyle="round", label="Lý tưởng (Ideal)")
    ax.plot(days, actual, color="#d32f2f", linewidth=2, marker="o", markersize=4.5,
            markeredgecolor="white", markeredgewidth=1.2, solid_joinstyle="round",
            label="Thực tế (Actual)")

    # Label each drop with the tasks finished that day.
    by_day: dict[dt.date, list[int]] = {}
    for task, day in sorted(done.items()):
        by_day.setdefault(day, []).append(task)
    for day, tasks in by_day.items():
        i = days.index(day)
        left = actual[i]
        # Put the label on the side of the step away from the ideal line.
        if left == 0:
            offset, ha, va = (-8, 6), "right", "bottom"
        elif ideal[i] > left + 1:
            offset, ha, va = (6, 6), "left", "bottom"
        else:
            offset, ha, va = (-8, -6), "right", "top"
        ax.annotate("Task " + ", ".join(map(str, tasks)), xy=(day, left),
                    xytext=offset, textcoords="offset points", ha=ha, va=va,
                    fontsize=8.5, color=ink)

    ax.set_xlim(days[0] - dt.timedelta(0.5), days[-1] + dt.timedelta(0.5))
    ax.set_ylim(0, total + 0.6)
    ax.set_yticks(range(0, total + 1, 2))
    ax.set_xticks(days[::3])
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m"))
    ax.set_xlabel("Ngày (2026)", color=muted)
    ax.set_ylabel("Số task còn lại", color=muted)
    ax.grid(axis="y", color=grid, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color("#bdbdbb")
    ax.tick_params(colors=muted, length=0, pad=4)
    ax.legend(frameon=False, loc="upper right", labelcolor=ink)

    OUT.parent.mkdir(exist_ok=True)
    fig.tight_layout()
    fig.savefig(OUT, facecolor="white")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
