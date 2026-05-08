// ===================== API CONFIGURATION =====================

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';
const CART_KEY = 'cart';

// ===================== UTILITY FUNCTIONS =====================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function removeCurrentUser() {
    localStorage.removeItem(USER_KEY);
}

function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(price);
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
    removeToken();
    removeCurrentUser();
    window.location.href = 'login.html';
}

// ===================== API FUNCTIONS =====================

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
            const message = data.message || 'API request failed';
            const error = new Error(message);
            if (data.errors) {
                error.details = data.errors;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===================== AUTHENTICATION FUNCTIONS =====================

function updateAuthUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('navLoginBtn');
    const dashboardBtn = document.getElementById('navDashboardBtn');
    const logoutBtn = document.getElementById('navLogoutBtn');
    const profileBtn = document.getElementById('navProfileBtn');
    const avatar = document.getElementById('navAvatar');
    const avatarContainer = document.getElementById('navAvatarContainer');

    if (!loginBtn || !dashboardBtn || !logoutBtn || !profileBtn || !avatar || !avatarContainer) {
        return;
    }

    if (user) {
        loginBtn.style.display = 'none';
        profileBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';

        if (user.role === 'vendor') {
            dashboardBtn.style.display = 'inline-block';
            dashboardBtn.textContent = '🏪 Vendor Dashboard';
        } else if (user.role === 'admin') {
            dashboardBtn.style.display = 'inline-block';
            dashboardBtn.textContent = '⚙️ Admin Dashboard';
        } else {
            dashboardBtn.style.display = 'none';
        }

        if (user.profileImage) {
            avatarContainer.style.display = 'inline-block';
            avatar.src = user.profileImage;
        } else {
            avatarContainer.style.display = 'none';
            avatar.src = '';
        }
    } else {
        loginBtn.style.display = 'inline-block';
        profileBtn.style.display = 'none';
        dashboardBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        avatarContainer.style.display = 'none';
        avatar.src = '';
    }
}

// ===================== PRODUCT LOADING FUNCTIONS =====================

async function loadProducts(category = '', sortBy = 'newest', searchTerm = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        return;
    }

    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (searchTerm) query.set('search', searchTerm);

    try {
        const response = await fetchAPI(`/products${query.toString() ? `?${query.toString()}` : ''}`);
        let products = response.data || [];

        // Client-side sorting support for the homepage.
        if (sortBy === 'price-low') {
            products = products.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            products = products.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'popular') {
            products = products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'newest') {
            products = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        displayProducts(products);
    } catch (error) {
        console.error('Failed to load products:', error);
        grid.innerHTML =
            '<div class="empty-state">Failed to load products. Please try again later.</div>';
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        return;
    }

    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state">No products found.</div>';
        return;
    }

    grid.innerHTML = products
        .map(
            (product) => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/250x200'}" 
                 alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-vendor">${product.vendorId?.name || 'Unknown Vendor'}</div>
                <div class="product-description">${product.description || 'No description'}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">⭐ ${(product.rating || 0).toFixed(1)}</div>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <button class="add-to-cart-btn" onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')">
                        🛒 Add
                    </button>
                </div>
                <div class="product-stock">
                    ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
            </div>
        </div>
    `
        )
        .join('');
}

// ===================== CART FUNCTIONS =====================

function addToCart(productId, name, price, image) {
    const cart = getCart();
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId,
            name,
            price,
            image,
            quantity: 1,
        });
    }

    setCart(cart);
    showNotification(`${name} added to cart!`);
    updateCartDisplay();
}

function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    updateCartDisplay();
}

function updateCartQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find((item) => item.productId === productId);
    const parsedQuantity = parseInt(quantity, 10);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (item) {
        item.quantity = parsedQuantity;
    }
    setCart(cart);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cart = getCart();
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');

    if (!cartSection || !cartItems) {
        return;
    }

    if (cart.length === 0) {
        cartSection.style.display = 'none';
        return;
    }

    cartSection.style.display = 'block';

    let totalPrice = 0;
    let totalQuantity = 0;

    cartItems.innerHTML = cart
        .map((item) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            totalQuantity += item.quantity;

            return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" 
                               onchange="updateCartQuantity('${item.productId}', this.value)">
                        <button onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="remove-btn" onclick="removeFromCart('${item.productId}')">Remove</div>
                </div>
                <div style="text-align: right;">
                    <div>${formatPrice(itemTotal)}</div>
                </div>
            </div>
        `;
        })
        .join('');

    const commission = totalPrice * 0.1;
    const total = totalPrice + commission;

    document.getElementById('subtotal').textContent = formatPrice(totalPrice);
    document.getElementById('commissionAmount').textContent = formatPrice(commission);
    document.getElementById('total').textContent = formatPrice(total);
}

// ===================== CHECKOUT FUNCTIONS =====================

function openCheckout() {
    const user = getCurrentUser();
    if (!user || user.role !== 'customer') {
        showNotification('Please login as a customer to checkout', 'error');
        window.location.href = 'login.html';
        return;
    }

    // Update checkout summary
    const cart = getCart();
    const subtotal = getCartTotal();
    const commission = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + commission) * 100) / 100;

    document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkoutCommission').textContent = formatPrice(commission);
    document.getElementById('checkoutTotal').textContent = formatPrice(total);

    document.getElementById('checkoutModal').style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function openProfileModal() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please login to update your profile', 'error');
        return;
    }

    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    if (user.profileImage) {
        document.getElementById('profileImagePreview').src = user.profileImage;
        document.getElementById('profileImagePreviewContainer').style.display = 'block';
    } else {
        document.getElementById('profileImagePreviewContainer').style.display = 'none';
    }

    document.getElementById('profileModal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function previewProfileImage(imageUrl) {
    if (!imageUrl) {
        document.getElementById('profileImagePreviewContainer').style.display = 'none';
        return;
    }

    document.getElementById('profileImagePreview').src = imageUrl;
    document.getElementById('profileImagePreviewContainer').style.display = 'block';
}

function handleProfileImageChange(event) {
    const file = event.target.files[0];
    if (!file) {
        previewProfileImage(null);
        return;
    }

    const reader = new FileReader();
    reader.onload = () => previewProfileImage(reader.result);
    reader.readAsDataURL(file);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function submitProfileForm(e) {
    e.preventDefault();

    const fileInput = document.getElementById('profileImageInput');
    const name = document.getElementById('profileName').value.trim();
    const updateData = { name };

    if (fileInput.files.length > 0) {
        updateData.profileImage = await fileToBase64(fileInput.files[0]);
    }

    try {
        const response = await fetchAPI('/auth/me', 'PATCH', updateData);
        setCurrentUser(response.data);
        updateAuthUI();
        showNotification('Profile updated successfully!', 'success');
        closeProfileModal();
    } catch (error) {
        showNotification(error.message || 'Failed to update profile', 'error');
    }
}

function updatePaymentFields() {
    const paymentMethod = document.getElementById('paymentMethod').value;
    const cardPaymentFields = document.getElementById('cardPaymentFields');
    const sameAsShippingCheckbox = document.getElementById('sameAsShipping');

    // Show/hide card fields based on payment method
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        cardPaymentFields.style.display = 'block';
    } else {
        cardPaymentFields.style.display = 'none';
    }

    // Reset billing address when same as shipping is checked
    sameAsShippingCheckbox.addEventListener('change', () => {
        const billingFields = document.getElementById('billingAddressFields');
        if (sameAsShippingCheckbox.checked) {
            billingFields.style.display = 'none';
        } else {
            billingFields.style.display = 'block';
        }
    });
}

function validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s+/g, '');
    return /^\d{16}$/.test(cleaned);
}

function validateCardExpiry(expiry) {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);
    
    if (expiryMonth < 1 || expiryMonth > 12) return false;
    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;
    
    return true;
}

function validateCardCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

function formatCardNumber(input) {
    const value = input.value.replace(/\s+/g, '');
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = formatted;
}

function formatCardExpiry(input) {
    const value = input.value.replace(/\D+/g, '');
    if (value.length >= 2) {
        input.value = value.slice(0, 2) + '/' + value.slice(2, 4);
    } else {
        input.value = value;
    }
}

async function submitCheckout(e) {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    const paymentMethod = document.getElementById('paymentMethod').value;

    // Validate payment method
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'error');
        return;
    }

    // Validate card details if paying with card
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        const cardholderName = document.getElementById('cardholderName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVV = document.getElementById('cardCVV').value;

        if (!cardholderName) {
            showNotification('Please enter cardholder name', 'error');
            return;
        }

        if (!validateCardNumber(cardNumber)) {
            showNotification('Please enter a valid 16-digit card number', 'error');
            return;
        }

        if (!validateCardExpiry(cardExpiry)) {
            showNotification('Please enter a valid expiry date (MM/YY)', 'error');
            return;
        }

        if (!validateCardCVV(cardCVV)) {
            showNotification('Please enter a valid CVV (3-4 digits)', 'error');
            return;
        }
    }

    const items = cart.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
    }));

    const orderData = {
        items,
        paymentMethod,
        shippingAddress: {
            street: document.getElementById('street').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            country: document.getElementById('country').value,
        },
        notes: document.getElementById('notes').value,
    };

    // Add payment details if card payment
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        const sameAsShipping = document.getElementById('sameAsShipping').checked;
        orderData.paymentDetails = {
            cardholderName: document.getElementById('cardholderName').value,
            cardNumber: document.getElementById('cardNumber').value.replace(/\s+/g, ''),
            cardExpiry: document.getElementById('cardExpiry').value,
            cardCVV: document.getElementById('cardCVV').value,
            cardType: paymentMethod,
            billingAddress: sameAsShipping
                ? orderData.shippingAddress
                : {
                    street: document.getElementById('billingStreet').value,
                    city: document.getElementById('billingCity').value,
                    state: document.getElementById('billingState').value,
                    postalCode: document.getElementById('billingPostalCode').value,
                    country: document.getElementById('billingCountry').value,
                },
        };
    }

    try {
        const response = await fetchAPI('/orders', 'POST', orderData);
        showNotification('🎉 Order placed successfully! Order #' + response.data.orderNumber, 'success');
        setCart([]);
        closeCheckout();
        updateCartDisplay();
        document.getElementById('checkoutForm').reset();
    } catch (error) {
        const message = error.details ? `${error.message}: ${error.details.join(', ')}` : error.message;
        showNotification(message || 'Failed to place order', 'error');
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// ===================== FILTER & SEARCH FUNCTIONS =====================

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchInput');

    if (!categoryFilter || !sortFilter || !searchInput) {
        return;
    }

    const category = categoryFilter.value;
    const sortBy = sortFilter.value;
    const searchTerm = searchInput.value.trim().toLowerCase();

    loadProducts(category, sortBy, searchTerm);
}

// ===================== EVENT LISTENERS =====================

document.addEventListener('DOMContentLoaded', () => {
    // Update auth UI
    updateAuthUI();

    // Load products
    loadProducts();

    // Update cart display
    updateCartDisplay();

    // Navigation buttons
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navProfileBtn = document.getElementById('navProfileBtn');
    const navDashboardBtn = document.getElementById('navDashboardBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');

    if (navLoginBtn) {
        navLoginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    if (navProfileBtn) {
        navProfileBtn.addEventListener('click', openProfileModal);
    }

    if (navDashboardBtn) {
        navDashboardBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) {
                return;
            }

            if (user.role === 'vendor') {
                window.location.href = 'vendor-dashboard.html';
            } else if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            }
        });
    }

    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', logout);
    }

    // Hero section
    const heroShopBtn = document.getElementById('heroShopBtn');
    const productsSection = document.getElementById('products');
    if (heroShopBtn && productsSection) {
        heroShopBtn.addEventListener('click', () => {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Filters
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchInput');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const checkoutForm = document.getElementById('checkoutForm');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckout);
    }

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckout);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', submitCheckout);
    }

    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');
    const profileImageInput = document.getElementById('profileImageInput');

    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', closeProfileModal);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', submitProfileForm);
    }

    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageChange);
    }

    // Card payment listeners
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }

    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => formatCardExpiry(e.target));
    }

    const cardCVVInput = document.getElementById('cardCVV');
    if (cardCVVInput) {
        cardCVVInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D+/g, '').slice(0, 4);
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const checkoutModal = document.getElementById('checkoutModal');
        const profileModal = document.getElementById('profileModal');
        if (e.target === checkoutModal) {
            closeCheckout();
        }
        if (e.target === profileModal) {
            closeProfileModal();
        }
    });
});
