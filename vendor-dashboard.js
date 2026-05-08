// ===================== API CONFIGURATION =====================

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// ===================== STATE =====================

let currentTab = 'overview';
let currentUser = null;

// ===================== UTILITY FUNCTIONS =====================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function showProfileImagePreview(imageUrl) {
    const previewContainer = document.getElementById('profileImagePreviewContainer');
    const previewImage = document.getElementById('profileImagePreview');

    if (!imageUrl) {
        previewContainer.style.display = 'none';
        previewImage.src = '';
        return;
    }

    previewImage.src = imageUrl;
    previewContainer.style.display = 'block';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
    }).format(price);
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

    if (!currentUser || currentUser.role !== 'vendor') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('vendorNameDisplay').textContent = `${currentUser.name} (Vendor)`;

    // Load initial data
    await loadProfileSettings();
    await loadOverview();
    await loadVendorProducts();
}

// ===================== TAB SWITCHING =====================

function switchTab(tabName) {
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
    event.target.classList.add('active');

    // Load tab-specific data
    if (tabName === 'products') {
        loadVendorProducts();
    } else if (tabName === 'orders') {
        loadVendorOrders();
    } else if (tabName === 'earnings') {
        loadEarnings();
    }

    currentTab = tabName;
}

// ===================== OVERVIEW TAB =====================

async function loadOverview() {
    try {
        // Load products count
        const productsRes = await fetchAPI('/products/my-products');
        const products = productsRes.data || [];

        // Load orders
        const ordersRes = await fetchAPI('/orders/vendor-orders');
        const orders = ordersRes.data || [];

        let totalEarnings = 0;
        orders.forEach((order) => {
            if (order.vendorBreakdown) {
                totalEarnings += order.vendorBreakdown.vendorEarnings || 0;
            }
        });

        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalEarnings').textContent = formatPrice(totalEarnings);

        // Calculate average rating
        const totalRating = products.reduce((sum, p) => sum + (p.rating || 0), 0);
        const avgRating = products.length > 0 ? totalRating / products.length : 0;
        document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    } catch (error) {
        console.error('Failed to load overview:', error);
    }
}

async function loadProfileSettings() {
    try {
        const response = await fetchAPI('/auth/me');
        const user = response.data;

        if (!user) {
            showNotification('Unable to load profile settings', 'error');
            return;
        }

        currentUser = user;
        setCurrentUser(user);

        document.getElementById('vendorNameDisplay').textContent = `${user.name} (Vendor)`;
        document.getElementById('settingUserName').value = user.name || '';
        document.getElementById('settingStoreName').value = user.vendorDetails?.companyName || '';
        document.getElementById('settingStoreDescription').value = user.vendorDetails?.companyDescription || '';
        document.getElementById('settingStoreLogo').value = user.vendorDetails?.businessLicense || '';
        document.getElementById('settingStoreEmail').value = user.vendorDetails?.taxId || '';
        showProfileImagePreview(user.profileImage);

        const avatar = document.getElementById('vendorAvatar');
        if (user.profileImage) {
            avatar.src = user.profileImage;
            avatar.style.display = 'inline-block';
        } else {
            avatar.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to load profile settings:', error);
    }
}

// ===================== PRODUCTS TAB =====================

async function loadVendorProducts() {
    const container = document.getElementById('vendorProductsList');
    container.innerHTML = '<div class="loading">Loading products...</div>';

    try {
        const response = await fetchAPI('/products/my-products');
        const products = response.data || [];

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">No products added yet. Add your first product!</div>';
            return;
        }

        container.innerHTML = products
            .map(
                (product) => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load products:', error);
        container.innerHTML = '<div class="error-state">Failed to load products. Please try again.</div>';
    }
}

async function addProduct(e) {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
    };

    const addProductError = document.getElementById('addProductError');
    const addProductSuccess = document.getElementById('addProductSuccess');
    addProductError.style.display = 'none';
    addProductSuccess.style.display = 'none';

    try {
        const response = await fetchAPI('/products', 'POST', productData);

        if (!response.success) {
            const message = response.errors && Array.isArray(response.errors)
                ? response.errors.join(' | ')
                : response.message || 'Failed to add product';
            throw new Error(message);
        }

        addProductSuccess.textContent = 'Product added successfully!';
        addProductSuccess.style.display = 'block';
        document.getElementById('addProductForm').reset();
        await loadVendorProducts();
    } catch (error) {
        addProductError.textContent = error.message || 'Failed to add product';
        addProductError.style.display = 'block';
    }
}

function editProduct(productId) {
    fetchAPI(`/products/${productId}`)
        .then((response) => {
            const product = response.data;
            document.getElementById('editProductId').value = productId;
            document.getElementById('editProductName').value = product.name;
            document.getElementById('editProductPrice').value = product.price;
            document.getElementById('editProductStock').value = product.stock;
            document.getElementById('editProductImage').value = product.image || '';
            showEditProductImagePreview(product.image || '');
            document.getElementById('editProductModal').style.display = 'flex';
        })
        .catch((error) => {
            showNotification('Failed to load product details', 'error');
        });
}

function showEditProductImagePreview(imageSource) {
    const previewContainer = document.getElementById('editProductImagePreviewContainer');
    const previewImage = document.getElementById('editProductImagePreview');

    if (!imageSource) {
        previewContainer.style.display = 'none';
        previewImage.src = '';
        return;
    }

    if (typeof imageSource === 'string') {
        previewImage.src = imageSource;
    } else if (imageSource instanceof File) {
        previewImage.src = URL.createObjectURL(imageSource);
    } else {
        previewImage.src = '';
    }

    previewContainer.style.display = 'block';
}

async function submitEditProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('editProductId').value;
    const updateData = {
        name: document.getElementById('editProductName').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        stock: parseInt(document.getElementById('editProductStock').value),
        image: document.getElementById('editProductImage').value,
    };

    try {
        const response = await fetchAPI(`/products/${productId}`, 'PUT', updateData);

        if (!response.success) {
            const message = response.errors && Array.isArray(response.errors)
                ? response.errors.join(' | ')
                : response.message || 'Failed to update product';
            throw new Error(message);
        }

        showNotification('Product updated successfully!', 'success');
        document.getElementById('editProductModal').style.display = 'none';
        await loadVendorProducts();
    } catch (error) {
        showNotification(error.message || 'Failed to update product', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetchAPI(`/products/${productId}`, 'DELETE');
        showNotification('Product deleted successfully!', 'success');
        await loadVendorProducts();
    } catch (error) {
        showNotification(error.message || 'Failed to delete product', 'error');
    }
}

// ===================== ORDERS TAB =====================

async function loadVendorOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;

    try {
        const response = await fetchAPI('/orders/vendor-orders');
        let orders = response.data || [];

        if (statusFilter) {
            orders = orders.filter((order) => order.orderStatus === statusFilter);
        }

        const container = document.getElementById('vendorOrdersList');

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders found.</div>';
            return;
        }

        container.innerHTML = orders
            .map(
                (order) => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-number">${order.orderNumber}</span>
                    <span class="status-badge ${order.orderStatus}">${order.orderStatus}</span>
                </div>
                <div class="order-customer">Customer: ${order.userId?.name || 'Unknown'}</div>
                <div class="order-items">
                    ${order.items
                        .map(
                            (item) =>
                                `<div class="order-item-row">${item.productId?.name || 'Product'} x${item.quantity}</div>`
                        )
                        .join('')}
                </div>
                <div class="order-amount">${formatPrice(order.vendorBreakdown?.vendorEarnings || 0)}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">
                    Date: ${formatDate(order.createdAt)}
                </div>
                <button class="btn btn-secondary" onclick="updateOrderStatus('${order._id}', '${order.orderStatus}')">
                    Update Status
                </button>
            </div>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

async function updateOrderStatus(orderId, currentStatus) {
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const newStatus = prompt(`Current: ${currentStatus}\nEnter new status (${statuses.join(', ')}):`, currentStatus);

    if (!newStatus || newStatus === currentStatus) return;

    try {
        const response = await fetchAPI(`/orders/${orderId}/status`, 'PUT', { orderStatus: newStatus });
        showNotification('Order status updated!', 'success');
        await loadVendorOrders();
    } catch (error) {
        showNotification(error.message || 'Failed to update order', 'error');
    }
}

// ===================== EARNINGS TAB =====================

async function loadEarnings() {
    try {
        const response = await fetchAPI('/orders/vendor-orders');
        const orders = response.data || [];

        let totalRevenue = 0;
        let totalCommissionPaid = 0;
        let totalEarnings = 0;

        orders.forEach((order) => {
            const breakdown = order.vendorBreakdown;
            if (breakdown) {
                totalRevenue += breakdown.vendorItemsTotal || 0;
                totalCommissionPaid += breakdown.commissionPaid || 0;
                totalEarnings += breakdown.vendorEarnings || 0;
            }
        });

        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
        document.getElementById('totalCommissionPaid').textContent = formatPrice(totalCommissionPaid);
        document.getElementById('netEarnings').textContent = formatPrice(totalEarnings);

        // Build earnings table
        const tbody = document.getElementById('earningsTableBody');
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No earnings yet</td></tr>';
            return;
        }

        tbody.innerHTML = orders
            .map(
                (order) => `
            <tr>
                <td>${order.orderNumber}</td>
                <td>${formatPrice(order.vendorBreakdown?.vendorItemsTotal || 0)}</td>
                <td>${formatPrice(order.vendorBreakdown?.commissionPaid || 0)}</td>
                <td>${formatPrice(order.vendorBreakdown?.vendorEarnings || 0)}</td>
                <td>${formatDate(order.createdAt)}</td>
            </tr>
        `
            )
            .join('');
    } catch (error) {
        console.error('Failed to load earnings:', error);
    }
}

// ===================== SETTINGS TAB =====================

async function saveSettings(e) {
    e.preventDefault();

    const updateData = {
        name: document.getElementById('settingUserName').value.trim(),
        vendorDetails: {
            companyName: document.getElementById('settingStoreName').value,
            companyDescription: document.getElementById('settingStoreDescription').value,
            businessLicense: document.getElementById('settingStoreLogo').value,
            taxId: document.getElementById('settingStoreEmail').value,
        },
    };

    const profileFile = document.getElementById('settingProfileImage').files[0];
    if (profileFile) {
        updateData.profileImage = await fileToBase64(profileFile);
    }

    try {
        const response = await fetchAPI('/auth/me', 'PATCH', updateData);
        setCurrentUser(response.data);
        showNotification('Settings saved successfully!', 'success');
        await loadProfileSettings();
    } catch (error) {
        showNotification(error.message || 'Failed to save settings', 'error');
    }
}

// ===================== EVENT LISTENERS =====================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();

    // Tab switching
    document.querySelectorAll('.menu-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    // Add product form
    document.getElementById('addProductForm').addEventListener('submit', addProduct);

    // Edit product form
    document.getElementById('editProductForm').addEventListener('submit', submitEditProduct);
    document.getElementById('editProductImage').addEventListener('input', (e) => {
        showEditProductImagePreview(e.target.value);
    });

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('settingProfileImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showProfileImagePreview(URL.createObjectURL(file));
        } else {
            showProfileImagePreview(null);
        }
    });

    // Order status filter
    document.getElementById('orderStatusFilter').addEventListener('change', loadVendorOrders);

    // Logout button
    document.getElementById('dashboardLogoutBtn').addEventListener('click', logout);

    // Modal close
    document.getElementById('closeEditProduct').addEventListener('click', () => {
        document.getElementById('editProductModal').style.display = 'none';
    });
});
