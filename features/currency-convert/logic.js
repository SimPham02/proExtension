// Currency Convert Feature

const CURRENCIES = [
    'USD', 'VND', 'EUR', 'JPY', 'CNY', 'KRW', 'GBP', 'AUD', 'CAD', 'SGD', 'THB', 'RUB', 'HKD', 'MYR', 'IDR', 'PHP', 'CHF', 'NZD', 'SEK', 'NOK', 'DKK', 'INR', 'BRL', 'ZAR'
];

export async function initUI() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');
    const convertBtn = document.getElementById('convertBtn');
    const resultDiv = document.getElementById('convertResult');

    // Fill select options
    CURRENCIES.forEach(cur => {
        const opt1 = document.createElement('option');
        opt1.value = cur; opt1.textContent = cur;
        fromSelect.appendChild(opt1);
        const opt2 = document.createElement('option');
        opt2.value = cur; opt2.textContent = cur;
        toSelect.appendChild(opt2);
    });
    fromSelect.value = 'USD';
    toSelect.value = 'VND';

    convertBtn.onclick = async () => {
        const amount = parseFloat(amountInput.value) || 0;
        const from = fromSelect.value;
        const to = toSelect.value;
        resultDiv.style.display = 'block';
        if (amount <= 0) {
            resultDiv.textContent = 'Số tiền phải lớn hơn 0';
            return;
        }
        resultDiv.textContent = 'Đang chuyển đổi...';
        try {
            const rate = await getRate(from, to);
            if (rate === null) {
                resultDiv.textContent = 'Không lấy được tỷ giá!';
                return;
            }
            const converted = Math.round(amount * rate * 10) / 10;
            resultDiv.textContent = `${amount} ${from} ≈ ${converted.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} ${to}`;
        } catch (e) {
            resultDiv.textContent = 'Lỗi chuyển đổi!';
        }
    };
}

async function getRate(from, to) {
    if (from === to) return 1;
    // Sử dụng API miễn phí open.er-api.com
    const url = `https://open.er-api.com/v6/latest/${from}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result !== 'success' || !data.rates || !data.rates[to]) return null;
    return data.rates[to];
}
