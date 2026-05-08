// ===================== API CONFIGURATION =====================

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// ===================== STATE =====================

let currentGroupId = null;
let currentGroup = null;
let currentCart = null;
let allProducts = [];

// ===================== UTILITY FUNCTIONS =====================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(price || 0);
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

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[groups.js] API request', { url, method, body });

    try {
        const response = await fetch(url, options);
        const rawText = await response.text();
        let data = {};

        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (parseError) {
            console.error('[groups.js] Failed to parse API response', {
                url,
                rawText,
                parseError,
            });
            throw new Error('Invalid server response');
        }

        console.log('[groups.js] API response', {
            url,
            status: response.status,
            ok: response.ok,
            data,
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            if (response.status === 404) {
                throw new Error(`404 Not Found: ${data.message || endpoint}`);
            }
            if (response.status >= 500) {
                throw new Error(`500 Server Error: ${data.message || 'Internal server error'}`);
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('[groups.js] API Error:', error);
        if (error instanceof TypeError) {
            throw new Error('Failed to fetch. Make sure the backend is running on http://localhost:5000.');
        }
        throw error instanceof Error ? error : new Error('Unexpected API error');
    }
}

// ===================== GROUP MANAGEMENT =====================

async function loadUserGroups() {
    const container = document.getElementById('groupsContainer');
    const currentUser = getCurrentUser();
    if (container) {
        container.innerHTML = '<div class="loading">Loading groups...</div>';
    }

    if (!currentUser || !currentUser._id) {
        console.warn('[groups.js] Cannot load groups without a logged-in user');
        if (container) {
            container.innerHTML = '<div class="empty-state">Please log in to view your groups.</div>';
        }
        return;
    }

    try {
        const response = await fetchAPI(`/groups/my/${currentUser._id}`);
        const groups = response.data || [];

        displayGroups(groups);
    } catch (error) {
        console.error('Failed to load groups:', error);
        if (container) {
            container.innerHTML =
                `<div class="empty-state">Failed to load groups. ${error.message || 'Please try again.'}</div>`;
        }
    }
}

function displayGroups(groups) {
    const container = document.getElementById('groupsContainer');

    if (groups.length === 0) {
        container.innerHTML = '<div class="empty-state">No groups yet. Create your first group!</div>';
        return;
    }

    container.innerHTML = groups
        .map(
            (group) => `
        <div class="group-card">
            <div class="group-header">
                <h3>${group.name}</h3>
                <span class="group-status ${group.status}">${group.status}</span>
            </div>
            <p class="group-description">${group.description || 'No description'}</p>
            <div class="group-info">
                <span>👥 ${group.members.length}/${group.maxMembers} members</span>
                <span>👤 Created by ${(group.adminId && group.adminId.name) || (group.creator && group.creator.name) || 'Unknown'}</span>
            </div>
            <div class="group-actions">
                <button class="btn btn-primary" onclick="viewGroupCart('${group._id}')">View Cart</button>
                <button class="btn btn-secondary" onclick="copyGroupId('${group._id}')">Copy ID</button>
            </div>
        </div>
    `
        )
        .join('');
}

async function createGroup(e) {
    e.preventDefault();
    console.log('createGroup: submit handler fired');

    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();
    const maxMembers = parseInt(document.getElementById('maxMembers').value, 10);

    const createGroupError = document.getElementById('createGroupError');
    const createGroupSuccess = document.getElementById('createGroupSuccess');

    createGroupError.style.display = 'none';
    createGroupSuccess.style.display = 'none';

    if (!name) {
        createGroupError.textContent = 'Please enter a group name.';
        createGroupError.style.display = 'block';
        return;
    }

    try {
        const currentUser = getCurrentUser();

        if (!currentUser || !currentUser._id) {
            throw new Error('Please log in before creating a group.');
        }

        const payload = {
            name,
            description,
            maxMembers,
            adminId: currentUser._id,
        };

        console.log('[groups.js] createGroup payload', payload);
        console.log('[groups.js] create endpoint', 'http://localhost:5000/api/groups/create');

        const response = await fetchAPI('/groups/create', 'POST', payload);

        if (!response) {
            throw new Error('No response from server. Please log in again.');
        }

        createGroupSuccess.textContent = `${response.message || 'Group created successfully!'} Group ID: ${response.data?._id || 'created'}`;
        createGroupSuccess.style.display = 'block';

        document.getElementById('createGroupForm').reset();
        await loadUserGroups();
    } catch (error) {
        console.error('createGroup error:', error);
        createGroupError.textContent = error.message || 'Failed to create group';
        createGroupError.style.display = 'block';
    }
}

async function joinGroup(e) {
    e.preventDefault();

    const groupId = document.getElementById('joinGroupId').value.trim();

    const joinGroupError = document.getElementById('joinGroupError');
    const joinGroupSuccess = document.getElementById('joinGroupSuccess');

    joinGroupError.style.display = 'none';
    joinGroupSuccess.style.display = 'none';

    if (!groupId) {
        joinGroupError.textContent = 'Please enter a group ID.';
        joinGroupError.style.display = 'block';
        return;
    }

    try {
        const response = await fetchAPI(`/groups/${groupId}/join`, 'POST');

        joinGroupSuccess.textContent = 'Successfully joined the group!';
        joinGroupSuccess.style.display = 'block';

        document.getElementById('joinGroupForm').reset();
        loadUserGroups();
    } catch (error) {
        joinGroupError.textContent = error.message || 'Failed to join group';
        joinGroupError.style.display = 'block';
    }
}

function viewGroupCart(groupId) {
    window.location.href = `group-cart.html?group=${groupId}`;
}

function copyGroupId(groupId) {
    navigator.clipboard.writeText(groupId).then(() => {
        showNotification('Group ID copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = groupId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Group ID copied to clipboard!');
    });
}

// ===================== SHARED CART MANAGEMENT =====================

async function loadGroupCart() {
    const urlParams = new URLSearchParams(window.location.search);
    currentGroupId = urlParams.get('group');

    if (!currentGroupId) {
        showNotification('No group specified', 'error');
        window.location.href = 'groups.html';
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser._id) {
        showNotification('Please log in to access group shopping', 'error');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Load group details
        const groupResponse = await fetchAPI(`/groups/${currentGroupId}`);
        currentGroup = groupResponse.data;

        // Check if user is a member of the group
        const isMember = currentGroup.members.some(member => member._id === currentUser._id);
        if (!isMember) {
            showNotification('You are not a member of this group', 'error');
            window.location.href = 'groups.html';
            return;
        }

        // Load cart
        const cartResponse = await fetchAPI(`/groups/${currentGroupId}/cart`);
        currentCart = cartResponse.data;

        renderGroupDetails();
        displayCartItems(currentCart);
    } catch (error) {
        console.error('Failed to load group cart:', error);
        if (error.message && error.message.includes('not a member')) {
            showNotification('Access denied: You are not a member of this group', 'error');
            window.location.href = 'groups.html';
        } else {
            showNotification('Failed to load group cart: ' + error.message, 'error');
            window.location.href = 'groups.html';
        }
    }
}

function renderGroupDetails() {
    const nameEl = document.getElementById('groupName');
    const descriptionEl = document.getElementById('groupDescription');
    const memberCountEl = document.getElementById('memberCount');
    const memberListEl = document.getElementById('memberList');

    if (nameEl) nameEl.textContent = currentGroup.name;
    if (descriptionEl) descriptionEl.textContent = currentGroup.description || 'No description';
    if (memberCountEl) memberCountEl.textContent = `${currentGroup.members.length} members`;

    if (memberListEl) {
        memberListEl.innerHTML = currentGroup.members
            .map(member => `<span class="member-chip">${member.name}</span>`)
            .join('');
    }
}

function displayCartItems(cart) {
    const container = document.getElementById('cartItems');
    const checkoutSection = document.getElementById('checkoutSection');
    const currentUser = getCurrentUser();

    if (!cart || !cart.items || cart.items.length === 0) {
        container.innerHTML = '<div class="empty-state">Cart is empty. Add some items!</div>';
        checkoutSection.style.display = 'none';
        document.getElementById('itemCount').textContent = '0 items';
        return;
    }

    document.getElementById('itemCount').textContent = `${cart.items.length} items`;

    // Check if current user is group admin
    const adminUserId =
        (currentGroup && currentGroup.adminId && currentGroup.adminId._id) ||
        (currentGroup && currentGroup.creator && currentGroup.creator._id);
    const isGroupAdmin = adminUserId === currentUser._id;

    container.innerHTML = cart.items
        .map(
            (item) => {
                const yesVotes = item.votes.filter(vote => vote.vote === 'yes').length;
                const noVotes = item.votes.filter(vote => vote.vote === 'no').length;
                const totalVotes = yesVotes + noVotes;
                const memberCount = currentGroup ? currentGroup.members.length : 1;
                const hasAllVotes = totalVotes === memberCount;
                const hasMajority = hasAllVotes && yesVotes > noVotes;

                const userVote = item.votes.find(vote => vote.userId._id === currentUser._id);
                const currentVote = userVote ? userVote.vote : null;

                // Show voting status
                let voteStatus = '';
                let statusClass = 'pending';
                if (totalVotes === 0) {
                    voteStatus = '⏳ No votes yet';
                } else if (!hasAllVotes) {
                    voteStatus = `⏳ Waiting for ${memberCount - totalVotes} more vote(s)`;
                } else if (hasMajority) {
                    voteStatus = `✅ Approved (${yesVotes}/${memberCount} yes votes)`;
                    statusClass = 'approved';
                } else {
                    voteStatus = `❌ Rejected (${noVotes}/${memberCount} no votes)`;
                    statusClass = 'rejected';
                }

                return `
            <div class="cart-item ${hasMajority ? 'approved' : hasAllVotes ? 'rejected' : ''}">
                <img src="${item.productId.image || 'https://via.placeholder.com/80x80'}" alt="${item.productId.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.productId.name}</div>
                    <div class="cart-item-vendor">Added by ${item.addedBy.name}</div>
                    <div class="cart-item-price">${formatPrice(item.productId.price)} x ${item.quantity}</div>
                    <div class="vote-section">
                        <div class="vote-buttons">
                            <button class="vote-btn yes ${currentVote === 'yes' ? 'active' : ''}"
                                    onclick="voteOnItem('${item._id}', 'yes')">
                                👍 Yes (${yesVotes})
                            </button>
                            <button class="vote-btn no ${currentVote === 'no' ? 'active' : ''}"
                                    onclick="voteOnItem('${item._id}', 'no')">
                                👎 No (${noVotes})
                            </button>
                        </div>
                        <div class="vote-status ${statusClass}">
                            ${voteStatus}
                        </div>
                    </div>
                </div>
                <div class="cart-item-total">
                    ${formatPrice(item.productId.price * item.quantity)}
                </div>
            </div>
        `;
            }
        )
        .join('');

    // Show checkout button only if there are approved items AND user is group admin
    const memberCount = currentGroup ? currentGroup.members.length : 1;
    const hasApprovedItems = cart.items.some(item => {
        const yesVotes = item.votes.filter(vote => vote.vote === 'yes').length;
        const noVotes = item.votes.filter(vote => vote.vote === 'no').length;
        const totalVotes = yesVotes + noVotes;
        const hasAllVotes = totalVotes === memberCount;
        return hasAllVotes && yesVotes > noVotes;
    });

    const canCheckout = hasApprovedItems && isGroupAdmin;
    checkoutSection.style.display = canCheckout ? 'block' : 'none';

    // Update checkout button text based on admin status
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        if (!isGroupAdmin) {
            checkoutBtn.textContent = 'Only Group Admin Can Checkout';
            checkoutBtn.disabled = true;
        } else if (!hasApprovedItems) {
            checkoutBtn.textContent = 'No Approved Items for Checkout';
            checkoutBtn.disabled = true;
        } else {
            checkoutBtn.textContent = 'Complete Group Checkout';
            checkoutBtn.disabled = false;
        }
    }
}

// ===================== PRODUCT SEARCH =====================

async function loadProducts() {
    try {
        console.log('[groups.js] Loading products...');
        const response = await fetchAPI('/products');
        allProducts = response.data || [];
        console.log('[groups.js] Loaded products:', allProducts.length, 'products');
        if (allProducts.length === 0) {
            console.warn('[groups.js] No products loaded - this may cause issues with adding items to cart');
        }
    } catch (error) {
        console.error('[groups.js] Failed to load products:', error);
        allProducts = [];
        showNotification('Failed to load products. Please refresh the page.', 'error');
    }
}

function setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    const suggestions = document.getElementById('productSuggestions');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 1) {
            suggestions.style.display = 'none';
            return;
        }

        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(query)
        ).slice(0, 5);

        if (filteredProducts.length === 0) {
            suggestions.innerHTML = '<div class="suggestion-item" style="color: #666; cursor: default;">No products found</div>';
            suggestions.style.display = 'block';
            return;
        }

        suggestions.innerHTML = filteredProducts
            .map(product => {
                const safeName = product.name.replace(/'/g, "\\'");
                return `
                <div class="suggestion-item" onclick="selectProduct('${product._id}', '${safeName}', ${product.price})">
                    <img src="${product.image || 'https://via.placeholder.com/40x40'}" alt="${product.name}">
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">${formatPrice(product.price)}</div>
                    </div>
                </div>
            `;
            })
            .join('');

        suggestions.style.display = 'block';
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

let selectedProductId = null;

function selectProduct(productId, name, price) {
    selectedProductId = productId;
    document.getElementById('productSearch').value = name;
    document.getElementById('selectedProduct').innerHTML = `
        <div class="product-info">
            <strong>${name}</strong> - ${formatPrice(price)}
        </div>
    `;
    document.getElementById('productSuggestions').style.display = 'none';
    console.log('[groups.js] Product selected:', { productId, name, price });
}

// ===================== ADD ITEM TO CART =====================

async function addItemToCart(e) {
    e.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser._id) {
        showNotification('Please log in to add items to the cart', 'error');
        return;
    }

    // Check if user is a member of the current group
    if (!currentGroup || !currentGroup.members.some(member => member._id === currentUser._id)) {
        showNotification('You are not a member of this group', 'error');
        return;
    }

    const productSearchInput = document.getElementById('productSearch').value.trim();
    let productId = selectedProductId;

    // If no product selected from suggestions, try to find by name (partial match)
    if (!productId && productSearchInput) {
        const foundProduct = allProducts.find(p =>
            p.name.toLowerCase().includes(productSearchInput.toLowerCase())
        );
        if (foundProduct) {
            productId = foundProduct._id;
            // Auto-select the found product
            selectProduct(foundProduct._id, foundProduct.name, foundProduct.price);
        }
    }

    if (!productId) {
        showNotification('Please enter a valid product name or select from suggestions', 'error');
        return;
    }

    const quantity = parseInt(document.getElementById('itemQuantity').value, 10);
    if (quantity < 1) {
        showNotification('Quantity must be at least 1', 'error');
        return;
    }

    const addItemError = document.getElementById('addItemError');
    const addItemSuccess = document.getElementById('addItemSuccess');

    addItemError.style.display = 'none';
    addItemSuccess.style.display = 'none';

    try {
        const response = await fetchAPI(`/groups/${currentGroupId}/cart/items`, 'POST', {
            productId: productId,
            quantity,
        });

        addItemSuccess.textContent = 'Item added to cart successfully! Members can now vote on it.';
        addItemSuccess.style.display = 'block';

        document.getElementById('addItemForm').reset();
        selectedProductId = null;
        document.getElementById('selectedProduct').innerHTML = '<span class="no-selection">No product selected</span>';

        loadGroupCart();
    } catch (error) {
        // Handle the case where item already exists
        if (error.message && error.message.includes('already exists in cart')) {
            addItemError.textContent = 'This item is already in the cart. You can vote on it below instead.';
            addItemError.style.display = 'block';
            // Still reset the form but don't reload cart since item already exists
            document.getElementById('addItemForm').reset();
            selectedProductId = null;
            document.getElementById('selectedProduct').innerHTML = '<span class="no-selection">No product selected</span>';
        } else {
            addItemError.textContent = error.message || 'Failed to add item to cart';
            addItemError.style.display = 'block';
        }
    }
}

// ===================== VOTING =====================

async function voteOnItem(itemId, vote) {
    try {
        const response = await fetchAPI(`/groups/${currentGroupId}/cart/items/${itemId}/vote`, 'POST', {
            vote,
        });

        showNotification('Vote recorded successfully!');
        loadGroupCart();
    } catch (error) {
        showNotification(error.message || 'Failed to record vote', 'error');
    }
}

// ===================== CHECKOUT =====================

async function performCheckout() {
    const checkoutError = document.getElementById('checkoutError');
    const checkoutSuccess = document.getElementById('checkoutSuccess');

    checkoutError.style.display = 'none';
    checkoutSuccess.style.display = 'none';

    try {
        const response = await fetchAPI(`/groups/${currentGroupId}/checkout`, 'POST');

        checkoutSuccess.textContent = `Checkout completed! ${response.data.totalApprovedItems} items approved for purchase.`;
        checkoutSuccess.style.display = 'block';

        // Redirect to groups page after a delay
        setTimeout(() => {
            window.location.href = 'groups.html';
        }, 3000);
    } catch (error) {
        checkoutError.textContent = error.message || 'Checkout failed';
        checkoutError.style.display = 'block';
    }
}

// ===================== INITIALIZATION =====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('groups.js DOMContentLoaded');
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Check which page we're on
    const path = window.location.pathname.toLowerCase();
    const href = window.location.href.toLowerCase();
    if (path.includes('groups.html') || href.includes('groups.html')) {
        // Groups page
        const groupsContainer = document.getElementById('groupsContainer');
        if (groupsContainer) {
            groupsContainer.innerHTML = '<div class="loading">Loading groups...</div>';
        }
        loadUserGroups();
        loadProducts();

        // Form listeners
        const createGroupForm = document.getElementById('createGroupForm');
        const joinGroupForm = document.getElementById('joinGroupForm');
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', createGroup);
            console.log('createGroupForm listener attached');
        } else {
            console.warn('createGroupForm element not found on groups page');
        }

        if (joinGroupForm) {
            joinGroupForm.addEventListener('submit', joinGroup);
            console.log('joinGroupForm listener attached');
        } else {
            console.warn('joinGroupForm element not found on groups page');
        }
    } else if (path.includes('group-cart.html') || href.includes('group-cart.html')) {
        // Group cart page
        loadGroupCart();
        loadProducts();
        setupProductSearch();

        // Form listeners
        document.getElementById('addItemForm').addEventListener('submit', addItemToCart);
        document.getElementById('checkoutBtn').addEventListener('click', performCheckout);
    }
});
