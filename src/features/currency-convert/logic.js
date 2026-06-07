const CURRENCIES = [
    'USD', 'VND', 'EUR', 'JPY', 'CNY', 'KRW', 'GBP', 'AUD', 'CAD', 'SGD', 'THB', 'RUB',
    'HKD', 'MYR', 'IDR', 'PHP', 'CHF', 'NZD', 'SEK', 'NOK', 'DKK', 'INR', 'BRL', 'ZAR'
];
const RATE_CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const rateCache = new Map();

export async function initUI() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');
    const convertBtn = document.getElementById('convertBtn');
    const resultDiv = document.getElementById('convertResult');

    if (!fromSelect || !toSelect || !amountInput || !convertBtn || !resultDiv) return;

    renderCurrencyOptions(fromSelect, toSelect);
    fromSelect.value = 'USD';
    toSelect.value = 'VND';

    convertBtn.onclick = async () => {
        const amount = Number.parseFloat(amountInput.value) || 0;
        const from = fromSelect.value;
        const to = toSelect.value;
        resultDiv.style.display = 'block';

        if (amount <= 0) {
            resultDiv.textContent = 'So tien phai lon hon 0';
            return;
        }

        convertBtn.disabled = true;
        resultDiv.textContent = 'Dang chuyen doi...';
        try {
            const rate = await getRate(from, to);
            if (rate === null) {
                resultDiv.textContent = 'Khong lay duoc ty gia!';
                return;
            }

            const converted = Math.round(amount * rate * 10) / 10;
            resultDiv.textContent = `${amount} ${from} ~= ${converted.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} ${to}`;
        } catch {
            resultDiv.textContent = 'Loi chuyen doi!';
        } finally {
            convertBtn.disabled = false;
        }
    };
}

async function getRate(from, to) {
    if (from === to) return 1;

    const cached = rateCache.get(from);
    if (cached && Date.now() - cached.createdAt < RATE_CACHE_TTL_MS) {
        return cached.rates[to] ?? null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, {
            signal: controller.signal
        });
        if (!response.ok) return null;

        const data = await response.json();
        if (data.result !== 'success' || !data.rates) return null;

        rateCache.set(from, { rates: data.rates, createdAt: Date.now() });
        return data.rates[to] ?? null;
    } finally {
        clearTimeout(timeout);
    }
}

function renderCurrencyOptions(fromSelect, toSelect) {
    const fromFragment = document.createDocumentFragment();
    const toFragment = document.createDocumentFragment();

    CURRENCIES.forEach(currency => {
        fromFragment.appendChild(createOption(currency));
        toFragment.appendChild(createOption(currency));
    });

    fromSelect.replaceChildren(fromFragment);
    toSelect.replaceChildren(toFragment);
}

function createOption(currency) {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    return option;
}
