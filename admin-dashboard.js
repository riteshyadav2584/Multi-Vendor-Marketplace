// ===================== API CONFIGURATION =====================

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// ===================== STATE =====================

let currentTab = 'overview';
let currentUser = null;
let allUsers = [];
let allOrders = [];
let allProducts = [];

// ===================== UTILITY FUNCTIONS =====================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(price || 0);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function showNotification(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `${type}-message`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = 'login.html';
}

// ===================== INITIALIZATION =====================

async function initializeDashboard() {
    currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminNameDisplay').textContent = `${currentUser.name} (Admin)`;

    // Load initial data
    await loadOverview();
}

// ===================== TAB SWITCHING =====================

function switchTab(tabName, menuItem = null) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach((tab) => {
        tab.classList.remove('active');
    });

    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach((item) => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked menu item
    if (menuItem) {
        menuItem.classList.add('active');
    }

    // Load tab-specific data
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'vendors') {
        loadVendors();
    } else if (tabName === 'orders') {
        loadAllOrders();
    } else if (tabName === 'commissions') {
        loadCommissions();
    } else if (tabName === 'products') {
        loadAllProducts();
    } else if (tabName === 'reports') {
        loadReports();
    }

    currentTab = tabName;
}

// ===================== OVERVIEW TAB =====================

async function loadOverview() {
    try {
        // Load all data in parallel
        const [usersRes, productsRes, ordersRes] = await Promise.all([
            fetchAPI('/auth/users'),
            fetchAPI('/products?limit=1000'),
            fetchAPI('/orders?limit=1000&page=1')
        ]);

        const users = usersRes.data || [];
        const products = productsRes.data || [];
        const orders = ordersRes.data || [];

        // Calculate commission and payouts
        let totalCommission = 0;
        let totalPayouts = 0;

        orders.forEach((order) => {
            totalCommission += order.totalCommission || 0;
            totalPayouts += order.totalVendorAmount || 0;
        });

        // Count vendors
        const vendorUsers = users.filter(user => user.role === 'vendor');

        // Update stats
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalVendors').textContent = vendorUsers.length;
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalAdminOrders').textContent = orders.length;
        document.getElementById('totalCommission').textContent = formatPrice(totalCommission);
        document.getElementById('totalPayouts').textContent = formatPrice(totalPayouts);
    } catch (error) {
        console.error('Failed to load overview:', error);
        showNotification('Failed to load overview data', 'error');
    }
}

// ===================== USERS TAB =====================

async function loadUsers() {
    try {
        const response = await fetchAPI('/auth/users');
        const users = response.data || [];

        allUsers = users;
        displayUsers(users);
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users', 'error');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users
        .map(
            (user) => `
        <tr>
            <td>
                ${user.profileImage 
                    ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e5e7eb;">`
                    : '<span style="color: #6b7280; font-size: 12px;">Not Uploaded</span>'
                }
            </td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.isActive ? 'confirmed' : 'cancelled'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewUser('${user._id}')">View</button>
                <button class="btn ${user.isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleUserStatus('${user._id}', ${user.isActive})">
                    ${user.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `
        )
        .join('');
}

function viewUser(userId) {
    const user = allUsers.find((u) => u._id === userId);
    if (!user) return;

    let details = `
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
            ${user.profileImage 
                ? `<img src="${user.profileImage}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb;">`
                : '<div style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; color: #6b7280; font-size: 10px; text-align: center;">Not<br>Uploaded</div>'
            }
            <div>
                <h3 style="margin: 0;">${user.name}</h3>
                <p style="margin: 5px 0; color: #6b7280;">${user.email}</p>
            </div>
        </div>
        <div>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</p>
            <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
    `;

    if (user.role === 'vendor' && user.vendorDetails) {
        details += `
            <h4>Vendor Details:</h4>
            <p><strong>Company:</strong> ${user.vendorDetails.companyName || 'Not provided'}</p>
            <p><strong>Description:</strong> ${user.vendorDetails.companyDescription || 'Not provided'}</p>
            <p><strong>Approved:</strong> ${user.vendorDetails.isApproved ? 'Yes' : 'No'}</p>
        `;
    }

    details += '</div>';

    // Create a simple modal for user details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>User Details</h2>
            ${details}
        </div>
    `;
    document.body.appendChild(modal);
}

async function toggleUserStatus(userId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await fetchAPI(`/auth/users/${userId}/status`, 'PATCH', { isActive: newStatus });

        if (response.success) {
            showNotification(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            loadUsers(); // Reload the users list
        }
    } catch (error) {
        console.error('Failed to update user status:', error);
        showNotification('Failed to update user status', 'error');
    }
}

// ===================== VENDORS TAB =====================

async function loadVendors() {
    try {
        const response = await fetchAPI('/products?limit=1000');
        const products = response.data || [];

        // Extract unique vendors
        const vendorMap = new Map();

        products.forEach((product) => {
            const vendorId = product.vendorId._id;
            if (!vendorMap.has(vendorId)) {
                vendorMap.set(vendorId, {
                    id: vendorId,
                    name: product.vendorId.name,
                    products: 0,
                    totalSales: 0,
                });
            }
            vendorMap.get(vendorId).products += 1;
        });

        const tbody = document.getElementById('vendorsTableBody');

        if (vendorMap.size === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No vendors found</td></tr>';
            return;
        }

        tbody.innerHTML = Array.from(vendorMap.values())
            .map(
                (vendor) => `
            <tr>
                <td>${vendor.name}</td>
                <td>-</td>
                <td>${vendor.products}</td>
                <td>₹0.00</td>
                <td>₹0.00</td>
                <td>0.0</td>
                <td><span class="status-badge confirmed">Active</span></td>
                <td>
                    <button class="btn btn-secondary" onclick="viewVendor('${vendor.id}')">View</button>
                </td>
            </tr>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load vendors:', error);
    }
}

function viewVendor(vendorId) {
    showNotification('Vendor details feature coming soon', 'info');
}

// ===================== ORDERS TAB =====================

async function loadAllOrders() {
    const statusFilter = document.getElementById('adminOrderStatusFilter').value;
    const paymentFilter = document.getElementById('adminPaymentStatusFilter').value;

    try {
        const response = await fetchAPI('/orders?limit=1000&page=1');
        let orders = response.data || [];

        if (statusFilter) {
            orders = orders.filter((o) => o.orderStatus === statusFilter);
        }
        if (paymentFilter) {
            orders = orders.filter((o) => o.paymentStatus === paymentFilter);
        }

        allOrders = orders;
        displayOrders(orders);
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders
        .map(
            (order) => `
        <tr>
            <td>${order.orderNumber}</td>
            <td>${order.userId?.name || 'Unknown'}</td>
            <td>${formatPrice(order.totalPrice)}</td>
            <td>${formatPrice(order.totalCommission)}</td>
            <td><span class="status-badge ${order.orderStatus}">${order.orderStatus}</span></td>
            <td><span class="status-badge ${order.paymentStatus}">${order.paymentStatus}</span></td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewOrderDetails('${order._id}')">View</button>
            </td>
        </tr>
    `
        )
        .join('');
}

function viewOrderDetails(orderId) {
    const order = allOrders.find((o) => o._id === orderId);
    if (!order) return;

    const content = `
        <div>
            <p><strong>Order #</strong> ${order.orderNumber}</p>
            <p><strong>Customer:</strong> ${order.userId?.name}</p>
            <p><strong>Total:</strong> ${formatPrice(order.totalPrice)}</p>
            <p><strong>Commission:</strong> ${formatPrice(order.totalCommission)}</p>
            <p><strong>Items:</strong></p>
            <ul>
                ${order.items.map((item) => `<li>${item.productId?.name} x${item.quantity}</li>`).join('')}
            </ul>
        </div>
    `;

    document.getElementById('orderDetailsContent').innerHTML = content;
    document.getElementById('modalOrderStatus').value = order.orderStatus;
    document.getElementById('modalPaymentStatus').value = order.paymentStatus;
    document.getElementById('orderDetailsModal').style.display = 'flex';
}

// ===================== COMMISSIONS TAB =====================

async function loadCommissions() {
    try {
        const ordersRes = await fetchAPI('/orders?limit=1000&page=1');
        const orders = ordersRes.data || [];

        let totalCommission = 0;
        const vendorCommissions = new Map();

        orders.forEach((order) => {
            totalCommission += order.totalCommission || 0;

            order.items.forEach((item) => {
                if (item.vendorId) {
                    const vendorId = item.vendorId._id || item.vendorId;
                    if (!vendorCommissions.has(vendorId)) {
                        vendorCommissions.set(vendorId, {
                            vendor: item.vendorId.name,
                            orders: 0,
                            commission: 0,
                            earnings: 0,
                        });
                    }
                    const vc = vendorCommissions.get(vendorId);
                    vc.orders += 1;
                }
            });
        });

        const avgCommission = orders.length > 0 ? totalCommission / orders.length : 0;

        document.getElementById('analyticsCommission').textContent = formatPrice(totalCommission);
        document.getElementById('pendingPayouts').textContent = formatPrice(0);
        document.getElementById('avgCommission').textContent = formatPrice(avgCommission);

        const tbody = document.getElementById('commissionsTableBody');
        if (vendorCommissions.size === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No commission data</td></tr>';
            return;
        }

        tbody.innerHTML = Array.from(vendorCommissions.values())
            .map(
                (vc) => `
            <tr>
                <td>${vc.vendor}</td>
                <td>${vc.orders}</td>
                <td>${formatPrice(vc.commission)}</td>
                <td>${formatPrice(vc.earnings)}</td>
                <td>-</td>
            </tr>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load commissions:', error);
    }
}

// ===================== PRODUCTS TAB =====================

async function loadAllProducts() {
    const searchTerm = document.getElementById('adminProductSearch').value.toLowerCase();
    const category = document.getElementById('adminCategoryFilter').value;

    try {
        const response = await fetchAPI('/products?limit=1000');
        let products = response.data || [];

        if (searchTerm) {
            products = products.filter((p) => p.name.toLowerCase().includes(searchTerm));
        }
        if (category) {
            products = products.filter((p) => p.category === category);
        }

        allProducts = products;
        const tbody = document.getElementById('productsTableBody');

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products
            .map(
                (product) => `
            <tr>
                <td>${product.name}</td>
                <td>${product.vendorId?.name || 'Unknown'}</td>
                <td>${formatPrice(product.price)}</td>
                <td>${product.stock}</td>
                <td>${product.category}</td>
                <td>${(product.rating || 0).toFixed(1)}</td>
                <td>${formatDate(product.createdAt)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="viewProduct('${product._id}')">View</button>
                    <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
                </td>
            </tr>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function viewProduct(productId) {
    const product = allProducts.find((p) => p._id === productId);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Product Details</h2>
            <p><strong>Name:</strong> ${product.name}</p>
            <p><strong>Vendor:</strong> ${product.vendorId?.name || 'Unknown'}</p>
            <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
            <p><strong>Stock:</strong> ${product.stock}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Description:</strong> ${product.description || 'No description'}</p>
            <p><strong>Created:</strong> ${formatDate(product.createdAt)}</p>
            <div style="display:flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function editProduct(productId) {
    const product = allProducts.find((p) => p._id === productId);
    if (!product) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Edit Product</h2>
            <form id="adminProductEditForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="editProductName" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editProductDescription" rows="3">${product.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="editProductCategory" value="${product.category}" required>
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" id="editProductPrice" value="${product.price}" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Stock</label>
                    <input type="number" id="editProductStock" value="${product.stock}" min="0" step="1" required>
                </div>
                <div class="form-group">
                    <label>Image URL</label>
                    <input type="url" id="editProductImage" value="${product.image || ''}">
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('adminProductEditForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await updateProduct(productId, {
                name: document.getElementById('editProductName').value,
                description: document.getElementById('editProductDescription').value,
                category: document.getElementById('editProductCategory').value,
                price: parseFloat(document.getElementById('editProductPrice').value),
                stock: parseInt(document.getElementById('editProductStock').value, 10),
                image: document.getElementById('editProductImage').value,
            });
            showNotification('Product updated successfully', 'success');
            document.body.removeChild(modal);
            loadAllProducts();
        } catch (err) {
            console.error('Failed to update product:', err);
            showNotification(err.message || 'Failed to update product', 'error');
        }
    });
}

async function updateProduct(productId, updates) {
    const response = await fetchAPI(`/products/${productId}`, 'PUT', updates);
    return response;
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await fetchAPI(`/products/${productId}`, 'DELETE');
        showNotification('Product deleted successfully', 'success');
        loadAllProducts();
    } catch (error) {
        console.error('Failed to delete product:', error);
        showNotification(error.message || 'Failed to delete product', 'error');
    }
}

// ===================== REPORTS TAB =====================

async function loadReports() {
    try {
        const response = await fetchAPI('/orders?limit=1000&page=1');
        const orders = response.data || [];

        let totalRevenue = 0;
        let totalCommission = 0;
        let totalPayouts = 0;

        orders.forEach((order) => {
            totalRevenue += order.totalPrice || 0;
            totalCommission += order.totalCommission || 0;
            totalPayouts += order.totalVendorAmount || 0;
        });

        document.getElementById('reportOrders').textContent = orders.length;
        document.getElementById('reportRevenue').textContent = formatPrice(totalRevenue);
        document.getElementById('reportPlatformCommission').textContent = formatPrice(totalCommission);
        document.getElementById('reportVendorPayouts').textContent = formatPrice(totalPayouts);

        // Top vendors
        const vendorStats = new Map();

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const vendorId = item.vendorId._id || item.vendorId;
                if (!vendorStats.has(vendorId)) {
                    vendorStats.set(vendorId, {
                        vendor: item.vendorId.name,
                        orders: 0,
                        revenue: 0,
                        commission: 0,
                    });
                }
                const vs = vendorStats.get(vendorId);
                vs.orders += 1;
                vs.revenue += item.price * item.quantity;
                vs.commission += (item.price * item.quantity) * 0.1;
            });
        });

        const tbody = document.getElementById('topVendorsTableBody');
        if (vendorStats.size === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No data</td></tr>';
            return;
        }

        tbody.innerHTML = Array.from(vendorStats.values())
            .sort((a, b) => b.commission - a.commission)
            .slice(0, 10)
            .map(
                (vs) => `
            <tr>
                <td>${vs.vendor}</td>
                <td>${vs.orders}</td>
                <td>${formatPrice(vs.revenue)}</td>
                <td>${formatPrice(vs.commission)}</td>
            </tr>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

// ===================== EVENT LISTENERS =====================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();

    // Tab switching
    document.querySelectorAll('.menu-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab, item);
        });
    });

    // Filters
    document.getElementById('adminOrderStatusFilter').addEventListener('change', loadAllOrders);
    document.getElementById('adminPaymentStatusFilter').addEventListener('change', loadAllOrders);
    document.getElementById('adminProductSearch').addEventListener('input', loadAllProducts);
    document.getElementById('adminCategoryFilter').addEventListener('change', loadAllProducts);

    // Modal close
    document.getElementById('closeOrderDetails').addEventListener('click', () => {
        document.getElementById('orderDetailsModal').style.display = 'none';
    });

    // Logout
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
});
