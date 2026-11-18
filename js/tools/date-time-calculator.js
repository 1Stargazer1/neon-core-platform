document.addEventListener('DOMContentLoaded', () => {
    // ========== A. Date Difference Mode ==========
    const diffStartDate = document.getElementById('diff-start-date');
    const diffEndDate = document.getElementById('diff-end-date');
    const diffInclusive = document.getElementById('diff-inclusive');
    const diffTotalDays = document.getElementById('diff-total-days');
    const diffWeeksDays = document.getElementById('diff-weeks-days');
    const diffDirection = document.getElementById('diff-direction');
    const diffStartError = document.getElementById('diff-start-error');
    const diffEndError = document.getElementById('diff-end-error');
    const resetDifferenceBtn = document.getElementById('reset-difference');

    // ========== B. Add/Subtract Mode ==========
    const asStartDate = document.getElementById('as-start-date');
    const asOperation = document.getElementById('as-operation');
    const asDays = document.getElementById('as-days');
    const asResultDate = document.getElementById('as-result-date');
    const asDayOfWeek = document.getElementById('as-day-of-week');
    const asStartError = document.getElementById('as-start-error');
    const asDaysError = document.getElementById('as-days-error');
    const resetAddSubtractBtn = document.getElementById('reset-add-subtract');

    // ========== C. Working Days Mode ==========
    const wdStartDate = document.getElementById('wd-start-date');
    const wdEndDate = document.getElementById('wd-end-date');
    const wdInclusive = document.getElementById('wd-inclusive');
    const wdCount = document.getElementById('wd-count');
    const wdTotal = document.getElementById('wd-total');
    const wdWeekends = document.getElementById('wd-weekends');
    const wdStartError = document.getElementById('wd-start-error');
    const wdEndError = document.getElementById('wd-end-error');
    const resetWorkingDaysBtn = document.getElementById('reset-working-days');

    // ========== Mode Switching ==========
    const modeSections = document.querySelectorAll('.mode-section');
    const modeButtons = document.querySelectorAll('.mode-btn');

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');

            modeButtons.forEach(b => b.classList.remove('active'));
            modeSections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            document.getElementById(mode + '-mode').classList.remove('hidden');
        });
    });

    // ========== Utility Functions ==========

    // Parse ISO date string (YYYY-MM-DD) to UTC Date
    function parseUTCDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    // Format UTC Date to ISO string (YYYY-MM-DD)
    function formatUTCDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Get day of week name (0 = Sunday, ..., 6 = Saturday)
    function getDayName(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getUTCDay()];
    }

    // Check if date is weekday (Mon–Fri)
    function isWeekday(date) {
        const dayOfWeek = date.getUTCDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
    }

    // Calculate elapsed days between two UTC dates
    function getElapsedDays(date1, date2) {
        const ms1 = date1.getTime();
        const ms2 = date2.getTime();
        return Math.abs(ms2 - ms1) / (1000 * 60 * 60 * 24);
    }

    // ========== A. Date Difference Calculation ==========
    function updateDateDifference() {
        diffStartError.textContent = '';
        diffEndError.textContent = '';

        if (!diffStartDate.value || !diffEndDate.value) {
            diffTotalDays.textContent = '—';
            diffWeeksDays.textContent = '—';
            diffDirection.textContent = '—';
            return;
        }

        const start = parseUTCDate(diffStartDate.value);
        const end = parseUTCDate(diffEndDate.value);

        let days = getElapsedDays(start, end);

        if (diffInclusive.checked) {
            days += 1;
        }

        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;

        const isForward = end >= start;
        const directionText = isForward ? 'Forward' : 'Backward';

        diffTotalDays.textContent = Math.floor(days);
        diffWeeksDays.textContent = `${weeks} weeks, ${remainingDays} days`;
        diffDirection.textContent = directionText;
    }

    diffStartDate.addEventListener('change', updateDateDifference);
    diffEndDate.addEventListener('change', updateDateDifference);
    diffInclusive.addEventListener('change', updateDateDifference);

    resetDifferenceBtn.addEventListener('click', () => {
        diffStartDate.value = '';
        diffEndDate.value = '';
        diffInclusive.checked = false;
        diffStartError.textContent = '';
        diffEndError.textContent = '';
        diffTotalDays.textContent = '—';
        diffWeeksDays.textContent = '—';
        diffDirection.textContent = '—';
        diffStartDate.focus();
    });

    // ========== B. Add/Subtract Calculation ==========
    function updateAddSubtract() {
        asStartError.textContent = '';
        asDaysError.textContent = '';

        if (!asStartDate.value || asDays.value === '') {
            asResultDate.textContent = '—';
            asDayOfWeek.textContent = '—';
            return;
        }

        const daysNum = parseInt(asDays.value, 10);
        if (isNaN(daysNum) || daysNum < 0) {
            asDaysError.textContent = 'Enter a non-negative whole number.';
            asResultDate.textContent = '—';
            asDayOfWeek.textContent = '—';
            return;
        }

        const start = parseUTCDate(asStartDate.value);
        const operation = asOperation.value;

        let resultDate = new Date(start);
        if (operation === 'add') {
            resultDate.setUTCDate(resultDate.getUTCDate() + daysNum);
        } else {
            resultDate.setUTCDate(resultDate.getUTCDate() - daysNum);
        }

        const resultDateStr = formatUTCDate(resultDate);
        const dayName = getDayName(resultDate);

        asResultDate.textContent = resultDateStr;
        asDayOfWeek.textContent = dayName;
    }

    asStartDate.addEventListener('change', updateAddSubtract);
    asOperation.addEventListener('change', updateAddSubtract);
    asDays.addEventListener('input', updateAddSubtract);

    resetAddSubtractBtn.addEventListener('click', () => {
        asStartDate.value = '';
        asOperation.value = 'add';
        asDays.value = '';
        asStartError.textContent = '';
        asDaysError.textContent = '';
        asResultDate.textContent = '—';
        asDayOfWeek.textContent = '—';
        asStartDate.focus();
    });

    // ========== C. Working Days Calculation ==========
    function updateWorkingDays() {
        wdStartError.textContent = '';
        wdEndError.textContent = '';

        if (!wdStartDate.value || !wdEndDate.value) {
            wdCount.textContent = '—';
            wdTotal.textContent = '—';
            wdWeekends.textContent = '—';
            return;
        }

        const start = parseUTCDate(wdStartDate.value);
        const end = parseUTCDate(wdEndDate.value);

        // Ensure start <= end for iteration
        const minDate = start <= end ? start : end;
        const maxDate = start <= end ? end : start;

        let workingDays = 0;
        let totalDays = 0;
        const inclusive = wdInclusive.checked;

        for (let d = new Date(minDate); d <= maxDate; d.setUTCDate(d.getUTCDate() + 1)) {
            const isBoundary = d.getTime() === minDate.getTime() || d.getTime() === maxDate.getTime();
            if (!inclusive && isBoundary) continue;

            totalDays++;
            if (isWeekday(d)) {
                workingDays++;
            }
        }

        const weekendDays = totalDays - workingDays;

        wdCount.textContent = Math.max(0, workingDays);
        wdTotal.textContent = Math.max(0, totalDays);
        wdWeekends.textContent = Math.max(0, weekendDays);
    }

    wdStartDate.addEventListener('change', updateWorkingDays);
    wdEndDate.addEventListener('change', updateWorkingDays);
    wdInclusive.addEventListener('change', updateWorkingDays);

    resetWorkingDaysBtn.addEventListener('click', () => {
        wdStartDate.value = '';
        wdEndDate.value = '';
        wdInclusive.checked = false;
        wdStartError.textContent = '';
        wdEndError.textContent = '';
        wdCount.textContent = '—';
        wdTotal.textContent = '—';
        wdWeekends.textContent = '—';
        wdStartDate.focus();
    });
});
