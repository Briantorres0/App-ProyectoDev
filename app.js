// ==========================================================================
// DATOS DE DEMOSTRACIÓN INICIALES (Productos, Ventas, Gastos y Facturas AFIP)
// ==========================================================================
const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: "Set Tazas Gres Artesanal",
        category: "Cerámica",
        cost: 11500,
        price: 24500,
        stock: 8,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 2,
        name: "Florero Circular Minimal",
        category: "Deco",
        cost: 15000,
        price: 32000,
        stock: 3,
        image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 3,
        name: "Contenedor Hermético Salvia",
        category: "Cerámica",
        cost: 9200,
        price: 19800,
        stock: 12,
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 4,
        name: "Manta Rústica de Lino",
        category: "Textil",
        cost: 22000,
        price: 45000,
        stock: 2,
        image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 5,
        name: "Difusor Aromático Botánico",
        category: "Deco",
        cost: 7800,
        price: 16500,
        stock: 0,
        image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 6,
        name: "Tazón Desayuno Bicolor",
        category: "Cerámica",
        cost: 6500,
        price: 14200,
        stock: 15,
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80"
    }
];

function getInitialSales() {
    const now = Date.now();
    const day = 86400000;
    return [
        { id: 101, timestamp: now - (day * 5), customer: "Lucía Fernández (WhatsApp)", items: "2x Set Tazas Gres", total: 49000, profit: 26000 },
        { id: 102, timestamp: now - (day * 4), customer: "Mostrador (Tarjeta / QR)", items: "1x Florero Circular Minimal", total: 32000, profit: 17000 },
        { id: 103, timestamp: now - (day * 3), customer: "Camila Ruiz (WhatsApp)", items: "3x Tazón Desayuno Bicolor", total: 42600, profit: 23100 },
        { id: 104, timestamp: now - (day * 2), customer: "Estudio Arquitectura Sur (Factura A)", items: "2x Florero Circular Minimal", total: 64000, profit: 34000 },
        { id: 105, timestamp: now - (day * 1), customer: "Sofía Pereyra (WhatsApp)", items: "2x Contenedor Hermético Salvia", total: 39600, profit: 21200 },
        { id: 106, timestamp: now - 3600000, customer: "Mateo Alarcón (WhatsApp)", items: "1x Florero Circular + 1x Set Tazas", total: 56500, profit: 30000 }
    ];
}

const INITIAL_INVOICES = [
    { id: 201, date: "Hace 4 días", provider: "Horno Cerámico del Sur", type: "Factura A Compra", amount: 42000, receipt: "" },
    { id: 202, date: "Hace 2 días", provider: "Packaging & Cajas Eco", type: "Factura B/C Compra", amount: 14500, receipt: "" }
];

const INITIAL_EMITTED_BILLS = [
    {
        id: 301,
        number: "0001-00000104",
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString("es-AR"),
        type: "A",
        clientName: "Estudio Arquitectura Sur S.R.L.",
        clientDoc: "30-71458963-2",
        payment: "Transferencia / Cta. Cte.",
        itemDetail: "2x Florero Circular Minimal",
        unitPrice: 32000,
        qty: 2,
        subtotal: 52892.56,
        iva: 11107.44,
        total: 64000,
        cae: "74185296301478"
    }
];

const INITIAL_CONFIG = {
    storeName: "ProyectoDev",
    cuit: "20-00000000-7",
    phone: "2244424335",
    adminPass: "admin123",
    cloudUrl: ""
};

// ==========================================================================
// ESTADO GLOBAL & SINCRONIZACIÓN EN TIEMPO REAL ENTRE PÁGINA DUEÑO Y CLIENTE
// ==========================================================================
let products = JSON.parse(localStorage.getItem("proyectodev_products")) || INITIAL_PRODUCTS;
let sales = JSON.parse(localStorage.getItem("proyectodev_sales")) || getInitialSales();
let invoices = JSON.parse(localStorage.getItem("proyectodev_invoices")) || INITIAL_INVOICES;
let emittedBills = JSON.parse(localStorage.getItem("proyectodev_emitted_bills")) || INITIAL_EMITTED_BILLS;
let storeConfig = Object.assign({}, INITIAL_CONFIG, JSON.parse(localStorage.getItem("proyectodev_config") || "{}"));

let cart = [];
let currentCategory = "all";
let searchQuery = "";
let adminSearchQuery = "";
let isAuthenticated = sessionStorage.getItem("proyectodev_auth") === "true";

// Canal de sincronización en vivo entre la pestaña del Dueño y la pestaña del Cliente
const syncChannel = ("BroadcastChannel" in window) ? new BroadcastChannel("proyectodev_live_sync") : null;

function persistAllData(notifyMessage) {
    localStorage.setItem("proyectodev_products", JSON.stringify(products));
    localStorage.setItem("proyectodev_sales", JSON.stringify(sales));
    localStorage.setItem("proyectodev_invoices", JSON.stringify(invoices));
    localStorage.setItem("proyectodev_emitted_bills", JSON.stringify(emittedBills));
    localStorage.setItem("proyectodev_config", JSON.stringify(storeConfig));

    if (syncChannel) {
        syncChannel.postMessage({ type: "SYNC_DATA" });
    }

    if (storeConfig.cloudUrl) {
        fetch(storeConfig.cloudUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ products, sales, invoices, emittedBills, storeConfig })
        }).catch(() => {});
    }

    renderApp();
    if (notifyMessage) showToast(notifyMessage);
}

function reloadFromStorage() {
    products = JSON.parse(localStorage.getItem("proyectodev_products")) || INITIAL_PRODUCTS;
    sales = JSON.parse(localStorage.getItem("proyectodev_sales")) || getInitialSales();
    invoices = JSON.parse(localStorage.getItem("proyectodev_invoices")) || INITIAL_INVOICES;
    emittedBills = JSON.parse(localStorage.getItem("proyectodev_emitted_bills")) || INITIAL_EMITTED_BILLS;
    storeConfig = Object.assign({}, INITIAL_CONFIG, JSON.parse(localStorage.getItem("proyectodev_config") || "{}"));
    renderApp();
}

if (syncChannel) {
    syncChannel.onmessage = () => reloadFromStorage();
}
window.addEventListener("storage", () => reloadFromStorage());

// ==========================================================================
// DETECCIÓN DE MODO CLIENTE EXCLUSIVO (?modo=tienda) Y AUTENTICACIÓN
// ==========================================================================
const urlParams = new URLSearchParams(window.location.search);
const isClientOnlyMode = urlParams.get("modo") === "tienda";

const authScreen = document.getElementById("auth-screen");
const clientHero = document.getElementById("client-hero");
const modeSwitcher = document.getElementById("mode-switcher");
const btnViewCatalog = document.getElementById("btn-view-catalog");
const btnViewAdmin = document.getElementById("btn-view-admin");
const catalogView = document.getElementById("catalog-view");
const adminView = document.getElementById("admin-view");
const cartFab = document.getElementById("cart-fab");

if (isClientOnlyMode) {
    modeSwitcher.style.display = "none";
    document.getElementById("ui-store-tag").textContent = "Catálogo Oficial";
}

function openAdminPanel() {
    btnViewAdmin.classList.add("active");
    btnViewCatalog.classList.remove("active");
    adminView.classList.add("active");
    catalogView.classList.remove("active");
    clientHero.style.display = "none"; // El título grande solo se ve en la vista cliente
    cartFab.style.display = "none";
}

function openClientCatalog() {
    btnViewCatalog.classList.add("active");
    btnViewAdmin.classList.remove("active");
    catalogView.classList.add("active");
    adminView.classList.remove("active");
    clientHero.style.display = "block";
    cartFab.style.display = "flex";
}

btnViewCatalog.addEventListener("click", openClientCatalog);

btnViewAdmin.addEventListener("click", () => {
    if (!isAuthenticated) {
        authScreen.classList.add("active");
        document.getElementById("login-pass").focus();
        return;
    }
    openAdminPanel();
});

document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const passInput = document.getElementById("login-pass").value.trim();
    const validPass = storeConfig.adminPass || "admin123";

    if (passInput === validPass) {
        isAuthenticated = true;
        sessionStorage.setItem("proyectodev_auth", "true");
        authScreen.classList.remove("active");
        document.getElementById("login-pass").value = "";
        openAdminPanel();
        showToast("Bienvenido al Menú Administración");
    } else {
        showToast("Contraseña incorrecta");
    }
});

document.getElementById("btn-back-to-shop").addEventListener("click", () => {
    authScreen.classList.remove("active");
    openClientCatalog();
});

document.getElementById("btn-logout-admin").addEventListener("click", () => {
    isAuthenticated = false;
    sessionStorage.removeItem("proyectodev_auth");
    openClientCatalog();
    showToast("Sesión administrativa cerrada");
});

// ==========================================================================
// UTILIDADES DE FORMATO Y COMPRESIÓN DE IMÁGENES
// ==========================================================================
function formatPrice(num) {
    return "$" + Math.round(num).toLocaleString("es-AR");
}

const toastEl = document.getElementById("toast");
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function compressImage(file, maxWidth = 650, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ==========================================================================
// 1. RENDERIZADO DEL CATÁLOGO PÚBLICO (VISTA CLIENTE)
// ==========================================================================
const productsGrid = document.getElementById("products-grid");

function renderCatalog() {
    const filtered = products.filter(p => {
        const matchesCat = currentCategory === "all" || p.category === currentCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    productsGrid.innerHTML = "";

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#6E6A64; padding: 40px 0;">No se encontraron productos disponibles.</p>`;
        return;
    }

    filtered.forEach(prod => {
        const inCart = cart.find(item => item.id === prod.id);
        const availableStock = prod.stock - (inCart ? inCart.qty : 0);

        let badgeClass = "stock-pill";
        let badgeText = `Disponible (${availableStock} u.)`;
        if (availableStock <= 0) {
            badgeClass += " out";
            badgeText = "Sin stock";
        } else if (availableStock <= 3) {
            badgeClass += " low";
            badgeText = `¡Últimas ${availableStock} u.!`;
        }

        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-img-wrapper">
                <span class="${badgeClass}">${badgeText}</span>
                <img src="${prod.image}" alt="${prod.name}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-cat">${prod.category}</span>
                <h3 class="product-title">${prod.name}</h3>
                <div class="product-price">${formatPrice(prod.price)}</div>
                <button class="btn-add" ${availableStock <= 0 ? "disabled" : ""} onclick="addToCart(${prod.id})">
                    ${availableStock <= 0 ? "Agotado" : "Agregar al pedido"}
                </button>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// ==========================================================================
// 2. RENDERIZADO DEL MENÚ ADMINISTRACIÓN (DASHBOARD, FINANZAS Y GRÁFICOS)
// ==========================================================================
function renderDashboardAndCharts() {
    const capitalCost = products.reduce((acc, p) => acc + ((p.cost || p.price * 0.5) * p.stock), 0);
    const capitalSale = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

    const totalSalesRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const grossProfitFromSales = sales.reduce((acc, s) => acc + s.profit, 0);
    const totalExpenses = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const netProfit = grossProfitFromSales - totalExpenses;
    const costOfGoodsSold = Math.max(0, totalSalesRevenue - grossProfitFromSales);

    const lowStockProducts = products.filter(p => p.stock <= 3);

    document.getElementById("kpi-capital-cost").textContent = formatPrice(capitalCost);
    document.getElementById("kpi-capital-sale").textContent = `Valor de venta: ${formatPrice(capitalSale)}`;
    document.getElementById("kpi-total-sales").textContent = formatPrice(totalSalesRevenue);
    document.getElementById("kpi-sales-count").textContent = `${sales.length} operaciones registradas`;
    document.getElementById("kpi-net-profit").textContent = formatPrice(netProfit);
    document.getElementById("kpi-low-stock").textContent = lowStockProducts.length;

    // Gráfico de Barras de los últimos 7 días
    const barContainer = document.getElementById("bar-chart-container");
    barContainer.innerHTML = "";
    const daysNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dailyTotals = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dayStr = d.toDateString();
        const label = i === 0 ? "Hoy" : daysNames[d.getDay()];
        const sum = sales
            .filter(s => new Date(s.timestamp).toDateString() === dayStr)
            .reduce((acc, s) => acc + s.total, 0);
        dailyTotals.push({ label, sum });
    }

    const maxDaySale = Math.max(...dailyTotals.map(d => d.sum), 10000);
    dailyTotals.forEach(day => {
        const heightPct = Math.max(6, Math.round((day.sum / maxDaySale) * 100));
        const col = document.createElement("div");
        col.className = "bar-col";
        col.innerHTML = `
            <span class="bar-value">${day.sum > 0 ? "$" + Math.round(day.sum / 1000) + "k" : "-"}</span>
            <div class="bar-fill" style="height: ${heightPct}%;"></div>
            <span class="bar-label">${day.label}</span>
        `;
        barContainer.appendChild(col);
    });

    // Gráfico Circular (Dona de Rentabilidad)
    const totalDistribution = Math.max(1, Math.max(0, netProfit) + costOfGoodsSold + totalExpenses);
    const profitPct = Math.round((Math.max(0, netProfit) / totalDistribution) * 100);
    const costPct = Math.round((costOfGoodsSold / totalDistribution) * 100);
    const stop1 = profitPct;
    const stop2 = Math.min(100, profitPct + costPct);

    document.getElementById("profit-donut").style.background =
        `conic-gradient(#6E7E6F 0% ${stop1}%, #C9B99F ${stop1}% ${stop2}%, #C87D65 ${stop2}% 100%)`;

    const marginOverSales = totalSalesRevenue > 0 ? Math.round((netProfit / totalSalesRevenue) * 100) : 0;
    document.getElementById("donut-margin-pct").textContent = `${marginOverSales}%`;
    document.getElementById("legend-profit").textContent = formatPrice(Math.max(0, netProfit));
    document.getElementById("legend-cost").textContent = formatPrice(costOfGoodsSold);
    document.getElementById("legend-expenses").textContent = formatPrice(totalExpenses);

    // Asistente de Reposición Automática
    const restockText = document.getElementById("restock-summary-text");
    if (lowStockProducts.length === 0) {
        restockText.textContent = "Todo tu inventario tiene niveles óptimos de stock.";
    } else {
        const names = lowStockProducts.map(p => `${p.name} (${p.stock} u.)`).join(", ");
        restockText.textContent = `Atención: Reponer urgente → ${names}`;
    }
}

// ==========================================================================
// 3. RENDERIZADO DE INVENTARIO, VENTAS Y FACTURAS DE GASTOS
// ==========================================================================
function renderInventoryTable() {
    const tbody = document.getElementById("inventory-tbody");
    tbody.innerHTML = "";

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(adminSearchQuery.toLowerCase())
    );

    filtered.forEach(prod => {
        const cost = prod.cost || Math.round(prod.price * 0.5);
        const marginPct = prod.price > 0 ? Math.round(((prod.price - cost) / prod.price) * 100) : 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${prod.name}</strong></td>
            <td>${prod.category}</td>
            <td>${formatPrice(cost)}</td>
            <td><strong>${formatPrice(prod.price)}</strong></td>
            <td><span style="color:#556356; font-weight:600;">${marginPct}%</span></td>
            <td>
                <div class="stock-controls">
                    <button class="stock-btn" onclick="updateStock(${prod.id}, -1)">-</button>
                    <span class="stock-number">${prod.stock}</span>
                    <button class="stock-btn" onclick="updateStock(${prod.id}, 1)">+</button>
                </div>
            </td>
            <td>
                <button class="btn-delete" onclick="deleteProduct(${prod.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar selectores de productos en POS y Facturador AFIP
    const posSelect = document.getElementById("pos-product");
    const factSelect = document.getElementById("fact-product");
    const prevFactValue = factSelect.value;

    posSelect.innerHTML = "";
    factSelect.innerHTML = "";

    products.filter(p => p.stock > 0).forEach(p => {
        const optPos = document.createElement("option");
        optPos.value = p.id;
        optPos.textContent = `${p.name} — ${formatPrice(p.price)} (Disp: ${p.stock})`;
        posSelect.appendChild(optPos);

        const optFact = document.createElement("option");
        optFact.value = p.id;
        optFact.textContent = `${p.name} — ${formatPrice(p.price)} (Stock: ${p.stock})`;
        factSelect.appendChild(optFact);
    });

    if (prevFactValue && Array.from(factSelect.options).some(o => o.value === prevFactValue)) {
        factSelect.value = prevFactValue;
    }
    updateFacturaTotals();
}

function renderSalesTable() {
    const tbody = document.getElementById("sales-tbody");
    tbody.innerHTML = "";

    sales.slice().reverse().forEach(s => {
        const d = new Date(s.timestamp);
        const dateStr = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " " +
                        d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${s.customer}</strong></td>
            <td>${s.items}</td>
            <td><strong>${formatPrice(s.total)}</strong></td>
            <td style="color:#556356; font-weight:600;">+${formatPrice(s.profit)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderInvoicesTable() {
    const tbody = document.getElementById("invoices-tbody");
    tbody.innerHTML = "";

    const totalExp = invoices.reduce((acc, i) => acc + i.amount, 0);
    document.getElementById("total-invoices-badge").textContent = `Total Gastos: ${formatPrice(totalExp)}`;

    invoices.slice().reverse().forEach(inv => {
        const receiptBtn = inv.receipt
            ? `<button class="btn-outline-sm" onclick="viewReceipt('${inv.id}')">Ver Foto</button>`
            : `<span style="color:#6E6A64; font-size:0.8rem;">Sin adjunto</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${inv.date}</td>
            <td><strong>${inv.provider}</strong></td>
            <td>${inv.type}</td>
            <td style="color:#C87D65; font-weight:700;">-${formatPrice(inv.amount)}</td>
            <td>${receiptBtn}</td>
            <td><button class="btn-delete" onclick="deleteInvoice(${inv.id})">Borrar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================================================
// 4. FACTURADOR ELECTRÓNICO AFIP (FACTURA A, B, C + IMPRESIÓN PDF)
// ==========================================================================
const factTypeSelect = document.getElementById("fact-type");
const factProductSelect = document.getElementById("fact-product");
const factQtyInput = document.getElementById("fact-qty");

function getNextInvoiceNumber() {
    const nextNum = 104 + emittedBills.length;
    return `0001-${String(nextNum).padStart(8, "0")}`;
}

function updateFacturaTotals() {
    if (!factProductSelect) return;
    const prodId = Number(factProductSelect.value);
    const qty = Math.max(1, Number(factQtyInput.value) || 1);
    const type = factTypeSelect.value;

    const prod = products.find(p => p.id === prodId);
    if (!prod) {
        document.getElementById("fact-subtotal").textContent = "$0";
        document.getElementById("fact-iva").textContent = "$0";
        document.getElementById("fact-total").textContent = "$0";
        return;
    }

    const totalAmount = prod.price * qty;
    let subtotal = totalAmount;
    let iva = 0;

    if (type === "A") {
        // En Factura A discriminamos el 21% de IVA sobre el total
        subtotal = totalAmount / 1.21;
        iva = totalAmount - subtotal;
        document.getElementById("fact-iva-row").style.display = "flex";
    } else {
        document.getElementById("fact-iva-row").style.display = "none";
    }

    document.getElementById("fact-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("fact-iva").textContent = formatPrice(iva);
    document.getElementById("fact-total").textContent = formatPrice(totalAmount);
    document.getElementById("fact-next-num").value = getNextInvoiceNumber();
}

factTypeSelect.addEventListener("change", updateFacturaTotals);
factProductSelect.addEventListener("change", updateFacturaTotals);
factQtyInput.addEventListener("input", updateFacturaTotals);

function renderEmittedBillsTable() {
    const tbody = document.getElementById("emitted-invoices-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    document.getElementById("fact-next-num").value = getNextInvoiceNumber();

    emittedBills.slice().reverse().forEach(bill => {
        const ivaText = bill.type === "A"
            ? `${formatPrice(bill.subtotal)} + IVA ${formatPrice(bill.iva)}`
            : `Final (IVA Incl.)`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="badge-fact-type">${bill.type}</span></td>
            <td><strong>${bill.number}</strong><br><small style="color:#6E6A64;">${bill.date}</small></td>
            <td><strong>${bill.clientName}</strong><br><small style="color:#6E6A64;">CUIT/DNI: ${bill.clientDoc}</small></td>
            <td><small>${ivaText}</small></td>
            <td><strong>${formatPrice(bill.total)}</strong></td>
            <td>
                <button class="btn-outline-sm" onclick="printFactura('${bill.id}')">🖨️ Ver / PDF</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById("form-create-factura").addEventListener("submit", (e) => {
    e.preventDefault();
    const type = factTypeSelect.value;
    const clientName = document.getElementById("fact-client-name").value.trim();
    const clientDoc = document.getElementById("fact-client-doc").value.trim();
    const payment = document.getElementById("fact-payment").value;
    const prodId = Number(factProductSelect.value);
    const qty = Number(factQtyInput.value);

    const prod = products.find(p => p.id === prodId);
    if (!prod || prod.stock < qty) {
        showToast("Stock insuficiente para facturar esa cantidad");
        return;
    }

    const total = prod.price * qty;
    const subtotal = type === "A" ? (total / 1.21) : total;
    const iva = type === "A" ? (total - subtotal) : 0;
    const unitCost = prod.cost || Math.round(prod.price * 0.5);
    const profit = (prod.price - unitCost) * qty;

    // 1. Descontar del Stock
    prod.stock -= qty;

    // 2. Crear el comprobante fiscal
    const newBill = {
        id: Date.now(),
        number: getNextInvoiceNumber(),
        date: new Date().toLocaleDateString("es-AR"),
        type,
        clientName,
        clientDoc,
        payment,
        itemDetail: `${qty}x ${prod.name}`,
        unitPrice: prod.price,
        qty,
        subtotal,
        iva,
        total,
        cae: "74" + String(Date.now()).slice(-12)
    };
    emittedBills.push(newBill);

    // 3. Impactar en Ventas y Gráficos
    sales.push({
        id: Date.now() + 1,
        timestamp: Date.now(),
        customer: `${clientName} (Factura ${type})`,
        items: `${qty}x ${prod.name}`,
        total,
        profit
    });

    e.target.reset();
    persistAllData(`Factura ${type} N° ${newBill.number} emitida con éxito`);
    window.printFactura(newBill.id);
});

// Abre ventana con formato de Factura Argentina lista para guardar en PDF o imprimir
window.printFactura = function(billId) {
    const bill = emittedBills.find(b => String(b.id) === String(billId));
    if (!bill) return;

    const win = window.open("", "_blank", "width=780,height=900");
    if (!win) {
        showToast("Habilitá las ventanas emergentes para ver el PDF");
        return;
    }

    const ivaRowHtml = bill.type === "A"
        ? `<div class="tot-row"><span>Subtotal Neto Gravado:</span><strong>${formatPrice(bill.subtotal)}</strong></div>
           <div class="tot-row"><span>IVA (21%):</span><strong>${formatPrice(bill.iva)}</strong></div>`
        : `<div class="tot-row"><span>Subtotal:</span><strong>${formatPrice(bill.total)}</strong></div>`;

    win.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Factura ${bill.type} - ${bill.number}</title>
            <style>
                body { font-family: Arial, sans-serif; color: #222; margin: 0; padding: 30px; background: #f5f2eb; }
                .sheet { max-width: 680px; margin: 0 auto; background: #fff; border: 2px solid #222; padding: 28px; }
                .top-header { display: flex; justify-content: space-between; border-bottom: 2px solid #222; padding-bottom: 16px; position: relative; }
                .type-box { border: 2px solid #222; width: 56px; height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; background: #fff; }
                .type-box small { font-size: 9px; font-weight: normal; }
                .client-box { border-bottom: 1px solid #ccc; padding: 14px 0; font-size: 14px; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
                th { background: #eee; border-top: 1px solid #222; border-bottom: 1px solid #222; padding: 10px; text-align: left; }
                td { padding: 12px 10px; border-bottom: 1px solid #eee; }
                .totals { width: 280px; margin-left: auto; border-top: 2px solid #222; padding-top: 12px; }
                .tot-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
                .tot-final { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc; }
                .cae-footer { margin-top: 30px; padding-top: 12px; border-top: 1px dashed #999; display: flex; justify-content: space-between; font-size: 12px; color: #555; }
                .no-print { text-align: center; margin-bottom: 20px; }
                .btn-print { background: #6E7E6F; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
                @media print { body { background: #fff; padding: 0; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button class="btn-print" onclick="window.print()">🖨️ Imprimir o Guardar como PDF</button>
            </div>
            <div class="sheet">
                <div class="top-header">
                    <div>
                        <h2 style="margin:0 0 6px;">${storeConfig.storeName}</h2>
                        <div style="font-size:12px; color:#555;">
                            CUIT Emisor: ${storeConfig.cuit || "20-39123456-7"}<br>
                            Tel / WhatsApp: ${storeConfig.phone}
                        </div>
                    </div>
                    <div class="type-box">
                        ${bill.type}
                        <small>COD. 0${bill.type === "A" ? "1" : bill.type === "B" ? "6" : "11"}</small>
                    </div>
                    <div style="text-align:right;">
                        <h3 style="margin:0 0 6px;">FACTURA</h3>
                        <div style="font-size:13px;">
                            <strong>N°: ${bill.number}</strong><br>
                            Fecha: ${bill.date}
                        </div>
                    </div>
                </div>

                <div class="client-box">
                    <div>
                        <strong>Cliente / Razón Social:</strong> ${bill.clientName}<br>
                        <strong>Condición de Venta:</strong> ${bill.payment}
                    </div>
                    <div style="text-align:right;">
                        <strong>CUIT / DNI:</strong> ${bill.clientDoc}<br>
                        <strong>Condición IVA:</strong> ${bill.type === "A" ? "Responsable Inscripto" : "Consumidor Final / Monotributo"}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Cant.</th>
                            <th>Descripción del Producto</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${bill.qty}</td>
                            <td>${bill.itemDetail}</td>
                            <td>${formatPrice(bill.unitPrice)}</td>
                            <td><strong>${formatPrice(bill.total)}</strong></td>
                        </tr>
                    </tbody>
                </table>

                <div class="totals">
                    ${ivaRowHtml}
                    <div class="tot-final">
                        <span>TOTAL:</span>
                        <span>${formatPrice(bill.total)}</span>
                    </div>
                </div>

                <div class="cae-footer">
                    <span>Comprobante Autorizado Electrónicamente</span>
                    <span><strong>CAE N°:</strong> ${bill.cae}</span>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
};

// ==========================================================================
// ACCIONES DE ADMINISTRACIÓN Y AUTOMATIZACIONES
// ==========================================================================
window.updateStock = function(id, delta) {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.stock + delta < 0) return;
    prod.stock += delta;
    persistAllData(`Stock actualizado: ${prod.stock} u.`);
};

window.deleteProduct = function(id) {
    products = products.filter(p => p.id !== id);
    cart = cart.filter(i => i.id !== id);
    persistAllData("Producto eliminado");
};

window.deleteInvoice = function(id) {
    invoices = invoices.filter(inv => inv.id !== id);
    persistAllData("Gasto eliminado");
};

window.viewReceipt = function(id) {
    const inv = invoices.find(i => String(i.id) === String(id));
    if (!inv || !inv.receipt) return;
    document.getElementById("receipt-modal-title").textContent = `Comprobante: ${inv.provider}`;
    document.getElementById("receipt-modal-img").src = inv.receipt;
    document.getElementById("receipt-modal").classList.add("active");
};

document.getElementById("btn-close-receipt").addEventListener("click", () => {
    document.getElementById("receipt-modal").classList.remove("active");
});

// Automatización: Aumento masivo de precios por %
document.getElementById("form-bulk-price").addEventListener("submit", (e) => {
    e.preventDefault();
    const cat = document.getElementById("bulk-category").value;
    const pct = Number(document.getElementById("bulk-percent").value);
    if (!pct) return;

    const factor = 1 + (pct / 100);
    products.forEach(p => {
        if (cat === "all" || p.category === cat) {
            p.price = Math.round((p.price * factor) / 100) * 100;
            p.cost = Math.round(((p.cost || p.price * 0.5) * factor) / 100) * 100;
        }
    });

    document.getElementById("bulk-percent").value = "";
    persistAllData(`Precios actualizados un ${pct}% en tiempo real`);
});

// Copiar lista de reposición para enviar al proveedor
document.getElementById("btn-copy-restock").addEventListener("click", () => {
    const low = products.filter(p => p.stock <= 3);
    if (low.length === 0) {
        showToast("No hay productos con stock crítico");
        return;
    }
    const text = "📋 *PEDIDO DE REPOSICIÓN — " + storeConfig.storeName + "*\n\n" +
        low.map(p => `• ${p.name} (Stock actual: ${p.stock} u.)`).join("\n");
    navigator.clipboard.writeText(text);
    showToast("Lista de reposición copiada al portapapeles");
});

// Exportar Ventas a CSV (Excel)
document.getElementById("btn-export-csv").addEventListener("click", () => {
    let csv = "Fecha,Cliente,Productos,Total,Ganancia\n";
    sales.forEach(s => {
        const d = new Date(s.timestamp).toLocaleDateString("es-AR");
        csv += `"${d}","${s.customer}","${s.items}",${s.total},${s.profit}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${storeConfig.storeName.toLowerCase()}.csv`;
    a.click();
    showToast("Planilla de ventas descargada");
});

// ==========================================================================
// VENTA RÁPIDA EN MOSTRADOR (POS) & CARGA DE FACTURAS DE PROVEEDORES
// ==========================================================================
const posModal = document.getElementById("pos-modal");
document.getElementById("btn-open-pos").addEventListener("click", () => posModal.classList.add("active"));
document.getElementById("btn-close-pos").addEventListener("click", () => posModal.classList.remove("active"));

document.getElementById("form-pos-sale").addEventListener("submit", (e) => {
    e.preventDefault();
    const prodId = Number(document.getElementById("pos-product").value);
    const qty = Number(document.getElementById("pos-qty").value);
    const method = document.getElementById("pos-method").value;

    const prod = products.find(p => p.id === prodId);
    if (!prod || prod.stock < qty) {
        showToast("Stock insuficiente para esa cantidad");
        return;
    }

    prod.stock -= qty;
    const totalSale = prod.price * qty;
    const unitCost = prod.cost || Math.round(prod.price * 0.5);
    const netProfit = (prod.price - unitCost) * qty;

    sales.push({
        id: Date.now(),
        timestamp: Date.now(),
        customer: `Mostrador (${method})`,
        items: `${qty}x ${prod.name}`,
        total: totalSale,
        profit: netProfit
    });

    posModal.classList.remove("active");
    persistAllData("Venta registrada y descontada del stock");
});

// Carga de Facturas de Gasto con Foto
let uploadedInvoiceReceipt = "";
const invFileInput = document.getElementById("inv-file");
const invFileLabel = document.getElementById("inv-file-label");

invFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    invFileLabel.textContent = "Procesando comprobante...";
    uploadedInvoiceReceipt = await compressImage(file, 700, 0.7);
    invFileLabel.textContent = "✓ " + file.name;
});

document.getElementById("form-new-invoice").addEventListener("submit", (e) => {
    e.preventDefault();
    const provider = document.getElementById("inv-provider").value.trim();
    const type = document.getElementById("inv-type").value;
    const amount = Number(document.getElementById("inv-amount").value);

    invoices.push({
        id: Date.now(),
        date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        provider,
        type,
        amount,
        receipt: uploadedInvoiceReceipt
    });

    e.target.reset();
    uploadedInvoiceReceipt = "";
    invFileLabel.textContent = "📸 Subir foto del comprobante";
    persistAllData("Gasto registrado correctamente");
});

// ==========================================================================
// MODAL NUEVO PRODUCTO (CON SUBIDA DE ARCHIVO DESDE DISPOSITIVO O URL)
// ==========================================================================
const productModal = document.getElementById("product-modal");
const formNewProduct = document.getElementById("form-new-product");
const prodFileInput = document.getElementById("prod-file");
const prodUrlInput = document.getElementById("prod-img");
const fileLabelText = document.getElementById("file-label-text");
const previewContainer = document.getElementById("img-preview-container");
const previewImg = document.getElementById("img-preview");

let uploadedBase64Image = "";

prodFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        fileLabelText.textContent = "Procesando imagen...";
        uploadedBase64Image = await compressImage(file);
        fileLabelText.textContent = file.name;
        prodUrlInput.value = "";
        previewImg.src = uploadedBase64Image;
        previewContainer.classList.add("active");
    } catch {
        showToast("No se pudo procesar la imagen");
    }
});

prodUrlInput.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url) {
        uploadedBase64Image = "";
        prodFileInput.value = "";
        fileLabelText.textContent = "Subir foto desde mi dispositivo";
        previewImg.src = url;
        previewContainer.classList.add("active");
    } else if (!uploadedBase64Image) {
        previewContainer.classList.remove("active");
    }
});

function resetImageUpload() {
    uploadedBase64Image = "";
    prodFileInput.value = "";
    prodUrlInput.value = "";
    fileLabelText.textContent = "Subir foto desde mi dispositivo";
    previewImg.src = "";
    previewContainer.classList.remove("active");
}

document.getElementById("btn-remove-img").addEventListener("click", resetImageUpload);
document.getElementById("btn-open-modal").addEventListener("click", () => productModal.classList.add("active"));
document.getElementById("btn-close-modal").addEventListener("click", () => {
    productModal.classList.remove("active");
    resetImageUpload();
});

formNewProduct.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("prod-name").value.trim();
    const category = document.getElementById("prod-cat").value;
    const stock = Number(document.getElementById("prod-stock").value);
    const cost = Number(document.getElementById("prod-cost").value);
    const price = Number(document.getElementById("prod-price").value);
    const urlInput = prodUrlInput.value.trim();

    const defaultImg = "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80";

    products.unshift({
        id: Date.now(),
        name,
        category,
        cost,
        price,
        stock,
        image: uploadedBase64Image || urlInput || defaultImg
    });

    formNewProduct.reset();
    resetImageUpload();
    productModal.classList.remove("active");
    persistAllData("Nuevo producto agregado al catálogo");
});

// ==========================================================================
// CARRITO DEL CLIENTE & ENVÍO AUTOMÁTICO A WHATSAPP + REGISTRO EN VENTAS
// ==========================================================================
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items");
const cartCountBadge = document.getElementById("cart-count");
const cartTotalPrice = document.getElementById("cart-total-price");
const customerNameInput = document.getElementById("customer-name");

window.addToCart = function(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const existing = cart.find(item => item.id === id);
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + 1 > prod.stock) {
        showToast("Límite de stock disponible alcanzado");
        return;
    }

    if (existing) existing.qty += 1;
    else cart.push({ id: prod.id, name: prod.name, price: prod.price, cost: prod.cost || prod.price * 0.5, qty: 1 });

    renderApp();
    showToast("Agregado a tu pedido");
};

window.changeCartQty = function(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = cart[idx];
    const prod = products.find(p => p.id === id);
    const newQty = item.qty + delta;

    if (newQty <= 0) cart.splice(idx, 1);
    else if (prod && newQty <= prod.stock) item.qty = newQty;
    else showToast("No hay más unidades en stock");

    renderApp();
};

function renderCart() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    cartCountBadge.textContent = totalCount;
    cartTotalPrice.textContent = formatPrice(totalAmount);
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color:#6E6A64; text-align:center; margin-top:40px;">Tu pedido está vacío.</p>`;
        return;
    }

    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>${formatPrice(item.price)} c/u</span>
            </div>
            <div class="stock-controls">
                <button class="stock-btn" onclick="changeCartQty(${item.id}, -1)">-</button>
                <span class="stock-number">${item.qty}</span>
                <button class="stock-btn" onclick="changeCartQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });
}

document.getElementById("btn-send-whatsapp").addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Agregá productos antes de enviar");
        return;
    }

    const customerName = customerNameInput.value.trim() || "Cliente Web";
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const totalProfit = cart.reduce((acc, item) => acc + ((item.price - item.cost) * item.qty), 0);
    const itemsSummary = cart.map(i => `${i.qty}x ${i.name}`).join(", ");

    let message = `Hola! Soy *${customerName}*, te envío mi pedido desde el catálogo de *${storeConfig.storeName}*:\n\n`;
    cart.forEach(item => {
        message += `• ${item.qty}x ${item.name} (${formatPrice(item.price * item.qty)})\n`;
        const prod = products.find(p => p.id === item.id);
        if (prod) prod.stock = Math.max(0, prod.stock - item.qty);
    });
    message += `\n*Total a pagar: ${formatPrice(totalAmount)}*`;

    sales.push({
        id: Date.now(),
        timestamp: Date.now(),
        customer: `${customerName} (WhatsApp)`,
        items: itemsSummary,
        total: totalAmount,
        profit: totalProfit
    });

    cart = [];
    closeDrawer();
    persistAllData("Pedido registrado y enviado a WhatsApp");

    const url = `https://wa.me/${storeConfig.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
});

// ==========================================================================
// NAVEGACIÓN DE SUB-PESTAÑAS Y EVENTOS GENERALES
// ==========================================================================
document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");
    });
});

document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderCatalog();
});

document.getElementById("admin-search-input").addEventListener("input", (e) => {
    adminSearchQuery = e.target.value;
    renderInventoryTable();
});

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        renderCatalog();
    });
});

function closeDrawer() {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
}
cartFab.addEventListener("click", () => {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
});
document.getElementById("btn-close-cart").addEventListener("click", closeDrawer);
cartOverlay.addEventListener("click", closeDrawer);

// ==========================================================================
// ENLACE A LA PÁGINA EXCLUSIVA DEL CLIENTE & CONFIGURACIÓN
// ==========================================================================
function getCleanClientUrl() {
    const base = window.location.origin + window.location.pathname;
    return `${base}?modo=tienda`;
}

document.getElementById("btn-open-client-link").addEventListener("click", () => {
    window.open(getCleanClientUrl(), "_blank");
});

document.getElementById("btn-copy-client-url").addEventListener("click", () => {
    navigator.clipboard.writeText(getCleanClientUrl());
    showToast("Link de Tienda Cliente copiado");
});

document.getElementById("form-store-config").addEventListener("submit", (e) => {
    e.preventDefault();
    storeConfig.storeName = document.getElementById("cfg-name").value.trim() || "ProyectoDev";
    storeConfig.cuit = document.getElementById("cfg-cuit").value.trim() || "20-39123456-7";
    storeConfig.phone = document.getElementById("cfg-phone").value.trim() || "5491100000000";
    storeConfig.adminPass = document.getElementById("cfg-pass").value.trim() || "admin123";
    storeConfig.cloudUrl = document.getElementById("cfg-cloud").value.trim();
    persistAllData("Configuración y clave actualizadas");
});

// Exportar / Importar Base de Datos JSON completa
document.getElementById("btn-download-db").addEventListener("click", () => {
    const data = JSON.stringify({ products, sales, invoices, emittedBills, storeConfig }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "respaldo_proyectodev.json";
    a.click();
});

document.getElementById("input-upload-db").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const parsed = JSON.parse(ev.target.result);
            if (parsed.products) products = parsed.products;
            if (parsed.sales) sales = parsed.sales;
            if (parsed.invoices) invoices = parsed.invoices;
            if (parsed.emittedBills) emittedBills = parsed.emittedBills;
            if (parsed.storeConfig) storeConfig = parsed.storeConfig;
            persistAllData("Base de datos importada con éxito");
        } catch {
            showToast("Archivo JSON inválido");
        }
    };
    reader.readAsText(file);
});

// Restaurar Demo Original
document.getElementById("btn-reset-demo").addEventListener("click", () => {
    localStorage.clear();
    products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    sales = getInitialSales();
    invoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
    emittedBills = JSON.parse(JSON.stringify(INITIAL_EMITTED_BILLS));
    storeConfig = JSON.parse(JSON.stringify(INITIAL_CONFIG));
    cart = [];
    renderApp();
    showToast("Datos de demostración restaurados");
});

function renderApp() {
    document.getElementById("client-url-display").value = getCleanClientUrl();
    document.getElementById("cfg-name").value = storeConfig.storeName;
    document.getElementById("cfg-cuit").value = storeConfig.cuit || "20-39123456-7";
    document.getElementById("cfg-phone").value = storeConfig.phone;
    document.getElementById("cfg-pass").value = storeConfig.adminPass || "admin123";
    document.getElementById("cfg-cloud").value = storeConfig.cloudUrl || "";

    renderCatalog();
    renderDashboardAndCharts();
    renderInventoryTable();
    renderEmittedBillsTable();
    renderSalesTable();
    renderInvoicesTable();
    renderCart();
}

// Inicializar aplicación
renderApp();