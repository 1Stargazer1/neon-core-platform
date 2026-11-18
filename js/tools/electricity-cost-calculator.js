document.addEventListener('DOMContentLoaded', () => {
    // ========== Main Calculator Inputs ==========
    const deviceWatts = document.getElementById('device-watts');
    const deviceHours = document.getElementById('device-hours');
    const electricityRate = document.getElementById('electricity-rate');
    const numDays = document.getElementById('num-days');

    // Main Calculator Outputs
    const dailyEnergy = document.getElementById('daily-energy');
    const totalEnergy = document.getElementById('total-energy');
    const dailyCost = document.getElementById('daily-cost');
    const totalCost = document.getElementById('total-cost');
    const cost30day = document.getElementById('cost-30day');
    const cost365day = document.getElementById('cost-365day');

    // Error elements
    const wattError = document.getElementById('device-watts-error');
    const hoursError = document.getElementById('device-hours-error');
    const rateError = document.getElementById('electricity-rate-error');
    const daysError = document.getElementById('num-days-error');

    // ========== Comparison Inputs ==========
    const deviceAWatts = document.getElementById('device-a-watts');
    const deviceBWatts = document.getElementById('device-b-watts');

    // Comparison Outputs
    const compareACost = document.getElementById('compare-a-cost');
    const compareBCost = document.getElementById('compare-b-cost');
    const compareDifference = document.getElementById('compare-difference');
    const compareMoreExpensive = document.getElementById('compare-more-expensive');

    // Error elements
    const deviceAError = document.getElementById('device-a-error');
    const deviceBError = document.getElementById('device-b-error');

    // ========== Utility Functions ==========

    // Format currency
    function formatCurrency(value) {
        return '$' + value.toFixed(2) + ' AUD';
    }

    // Format energy
    function formatEnergy(value) {
        return value.toFixed(2) + ' kWh';
    }

    // Validate input values
    function validateInputs(watts, hours, rate, days) {
        wattError.textContent = '';
        hoursError.textContent = '';
        rateError.textContent = '';
        daysError.textContent = '';

        if (watts < 0) {
            wattError.textContent = 'Wattage must not be negative.';
            return false;
        }
        if (!isFinite(watts)) {
            wattError.textContent = 'Enter a valid number.';
            return false;
        }

        if (hours < 0 || hours > 24) {
            hoursError.textContent = 'Hours must be between 0 and 24.';
            return false;
        }
        if (!isFinite(hours)) {
            hoursError.textContent = 'Enter a valid number.';
            return false;
        }

        if (rate < 0) {
            rateError.textContent = 'Electricity rate must not be negative.';
            return false;
        }
        if (!isFinite(rate)) {
            rateError.textContent = 'Enter a valid number.';
            return false;
        }

        if (days <= 0) {
            daysError.textContent = 'Days must be greater than 0.';
            return false;
        }
        if (!isFinite(days)) {
            daysError.textContent = 'Enter a valid number.';
            return false;
        }

        return true;
    }

    // ========== Main Calculator ==========
    function updateMainCalculator() {
        const watts = parseFloat(deviceWatts.value) || 0;
        const hours = parseFloat(deviceHours.value) || 0;
        const rate = parseFloat(electricityRate.value) || 0;
        const days = parseFloat(numDays.value) || 0;

        // Clear outputs if any input is empty
        if (!deviceWatts.value || !deviceHours.value || !electricityRate.value || !numDays.value) {
            dailyEnergy.textContent = '—';
            totalEnergy.textContent = '—';
            dailyCost.textContent = '—';
            totalCost.textContent = '—';
            cost30day.textContent = '—';
            cost365day.textContent = '—';
            return;
        }

        if (!validateInputs(watts, hours, rate, days)) {
            dailyEnergy.textContent = '—';
            totalEnergy.textContent = '—';
            dailyCost.textContent = '—';
            totalCost.textContent = '—';
            cost30day.textContent = '—';
            cost365day.textContent = '—';
            return;
        }

        // Calculate
        const dailyKwh = (watts * hours) / 1000;
        const totalKwh = dailyKwh * days;
        const dailyCostAud = dailyKwh * rate;
        const totalCostAud = totalKwh * rate;
        const cost30dayAud = dailyCostAud * 30;
        const cost365dayAud = dailyCostAud * 365;

        // Update outputs
        dailyEnergy.textContent = formatEnergy(dailyKwh);
        totalEnergy.textContent = formatEnergy(totalKwh);
        dailyCost.textContent = formatCurrency(dailyCostAud);
        totalCost.textContent = formatCurrency(totalCostAud);
        cost30day.textContent = formatCurrency(cost30dayAud);
        cost365day.textContent = formatCurrency(cost365dayAud);
    }

    deviceWatts.addEventListener('input', updateMainCalculator);
    deviceHours.addEventListener('input', updateMainCalculator);
    electricityRate.addEventListener('input', updateMainCalculator);
    numDays.addEventListener('input', updateMainCalculator);

    document.getElementById('reset-main').addEventListener('click', () => {
        deviceWatts.value = '100';
        deviceHours.value = '8';
        electricityRate.value = '0.30';
        numDays.value = '30';
        wattError.textContent = '';
        hoursError.textContent = '';
        rateError.textContent = '';
        daysError.textContent = '';
        updateMainCalculator();
        deviceWatts.focus();
    });

    // ========== Comparison Calculator ==========
    function updateComparison() {
        const aWatts = parseFloat(deviceAWatts.value) || 0;
        const bWatts = parseFloat(deviceBWatts.value) || 0;
        const hours = parseFloat(deviceHours.value) || 0;
        const rate = parseFloat(electricityRate.value) || 0;
        const days = parseFloat(numDays.value) || 0;

        deviceAError.textContent = '';
        deviceBError.textContent = '';

        // Clear if inputs incomplete
        if (!deviceAWatts.value || !deviceBWatts.value || !deviceHours.value || !electricityRate.value || !numDays.value) {
            compareACost.textContent = '—';
            compareBCost.textContent = '—';
            compareDifference.textContent = '—';
            compareMoreExpensive.textContent = '—';
            return;
        }

        // Validate
        if (!isFinite(aWatts) || aWatts < 0) {
            deviceAError.textContent = 'Enter a valid non-negative number.';
            compareACost.textContent = '—';
            compareBCost.textContent = '—';
            compareDifference.textContent = '—';
            compareMoreExpensive.textContent = '—';
            return;
        }

        if (!isFinite(bWatts) || bWatts < 0) {
            deviceBError.textContent = 'Enter a valid non-negative number.';
            compareACost.textContent = '—';
            compareBCost.textContent = '—';
            compareDifference.textContent = '—';
            compareMoreExpensive.textContent = '—';
            return;
        }

        // Calculate costs for both devices
        const aDailyKwh = (aWatts * hours) / 1000;
        const bDailyKwh = (bWatts * hours) / 1000;
        const aDailyCost = aDailyKwh * rate;
        const bDailyCost = bDailyKwh * rate;
        const aTotalCost = aDailyCost * days;
        const bTotalCost = bDailyCost * days;

        const difference = Math.abs(aTotalCost - bTotalCost);
        const moreExpensive = aTotalCost > bTotalCost ? 'Device A' : (bTotalCost > aTotalCost ? 'Device B' : 'Same');

        compareACost.textContent = formatCurrency(aTotalCost);
        compareBCost.textContent = formatCurrency(bTotalCost);
        compareDifference.textContent = formatCurrency(difference);
        compareMoreExpensive.textContent = moreExpensive;
    }

    deviceAWatts.addEventListener('input', updateComparison);
    deviceBWatts.addEventListener('input', updateComparison);

    // Also update comparison when main calculator inputs change (shared hours/rate/days)
    deviceHours.addEventListener('input', updateComparison);
    electricityRate.addEventListener('input', updateComparison);
    numDays.addEventListener('input', updateComparison);

    document.getElementById('reset-comparison').addEventListener('click', () => {
        deviceAWatts.value = '1000';
        deviceBWatts.value = '500';
        deviceAError.textContent = '';
        deviceBError.textContent = '';
        updateComparison();
        deviceAWatts.focus();
    });

    // Initial update
    updateMainCalculator();
    updateComparison();
});
