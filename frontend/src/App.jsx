import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// === BACKEND URL ===
const API_URL = "https://newfabes-farm-store.onrender.com";

function App() {
  // === APP STATE ===
  // We start at "store" now, because Home IS Shop.
  const [view, setView] = useState("store"); 
  const [products, setProducts] = useState([]);
  
  // Cart & User (Persisted in LocalStorage)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart")) || []);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Temporary States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "", description: "", image: "" });
  const [editingId, setEditingId] = useState(null);
  const [checkoutData, setCheckoutData] = useState({ fullName: "", address: "" });

  // === EFFECTS ===
  useEffect(() => { refreshProducts(); }, []);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const refreshProducts = () => {
    axios.get(`${API_URL}/api/products`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  };

  // === ACTIONS ===
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === "admin" && loginData.password === "123") {
      setUser({ name: "Administrator", role: "admin" });
    } else {
      setUser({ name: loginData.username, role: "user" });
    }
    setView("store"); // Go to shop after login
  };

  const handleLogout = () => { setUser(null); setView("store"); };

  const addToCart = (p) => { setCart([...cart, p]); alert("Added to cart!"); };
  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const handleBuyNow = (p) => {
    addToCart(p);
    setView("checkout");
  };

  // === ADMIN CRUD ===
  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.put(`${API_URL}/api/products/${editingId}`, newProduct)
        .then(() => { alert("Updated!"); setEditingId(null); setNewProduct({}); refreshProducts(); });
    } else {
      axios.post(`${API_URL}/api/products`, newProduct)
        .then(() => { alert("Added!"); setNewProduct({}); refreshProducts(); });
    }
  };

  const prepareEdit = (e, p) => {
    e.stopPropagation();
    setNewProduct(p);
    setEditingId(p._id);
    window.scrollTo(0,0);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm("Delete this product?")) {
      axios.delete(`${API_URL}/api/products/${id}`).then(refreshProducts);
    }
  };

  // === FILTERING ===
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="app-container">
      
      {/* === MODERN HEADER (Screenshot Style) === */}
      <header className="main-header">
        {/* 1. Logo Left */}
        <div className="logo" onClick={() => setView("store")}>
          Fabe's <span>Farm</span>
        </div>

        {/* 2. Nav Center */}
        <nav className="nav-center">
          {/* Home and Shop are now the same thing */}
          <button className={`nav-link ${view === "store" ? "active" : ""}`} onClick={() => setView("store")}>Shop</button>
          <button className={`nav-link ${view === "about" ? "active" : ""}`} onClick={() => setView("about")}>About</button>
          <button className={`nav-link ${view === "contact" ? "active" : ""}`} onClick={() => setView("contact")}>Contact</button>
        </nav>

        {/* 3. Icons Right */}
        <div className="nav-right">
          {/* Cart Icon */}
          <button className="icon-btn" onClick={() => setView("cart")}>
            🛒 <span className="cart-badge">{cart.length}</span>
          </button>

          {/* User Icon / Login Logic */}
          <div className="user-menu">
             {user ? (
               <div style={{display:'flex', alignItems:'center'}}>
                 <span className="user-greeting">Hi, {user.name}</span>
                 <button onClick={handleLogout} style={{fontSize:'0.8rem', cursor:'pointer', border:'none', background:'none', textDecoration:'underline'}}>Sign Out</button>
               </div>
             ) : (
               <button className="icon-btn" onClick={() => setView("login")}>👤</button>
             )}
          </div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main className="main-content">
        
        {/* 1. SHOP VIEW (This is now Home) */}
        {view === "store" && (
          <div>
            {/* ADMIN PANEL (Only visible if Admin) */}
            {user && user.role === "admin" && (
              <div className="admin-panel">
                <h3>🛠️ Inventory Manager</h3>
                <form onSubmit={handleSubmitProduct} className="admin-form">
                  <div className="form-row">
                    <input className="admin-input" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                    <input className="admin-input" type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
                    <input className="admin-input" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                  </div>
                  <input className="admin-input" placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                  <input className="admin-input" placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} required />
                  
                  <div className="form-row">
                    <button type="submit" className="btn-save">{editingId ? "Update Item" : "Add to Inventory"}</button>
                    {editingId && <button type="button" className="btn-cancel" onClick={() => {setEditingId(null); setNewProduct({});}}>Cancel Edit</button>}
                  </div>
                </form>
              </div>
            )}

            {/* FILTERS */}
            <div className="shop-controls">
               <select className="category-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <input className="search-input" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* PRODUCT GRID */}
            <div className="product-grid">
              {filteredProducts.map(p => (
                <div key={p._id} className="product-card" onClick={() => {setSelectedProduct(p); setView("details");}}>
                   <img src={p.image} alt={p.name} onError={(e) => e.target.src = "https://placehold.co/300?text=No+Image"} />
                   <div className="card-info">
                     <h3>{p.name}</h3>
                     <div className="card-price">${p.price}</div>
                   </div>
                   
                   {/* ADMIN BUTTONS ON CARD */}
                   {user && user.role === "admin" && (
                     <div className="admin-actions">
                       <button className="btn-edit" onClick={(e) => prepareEdit(e, p)}>Edit</button>
                       <button className="btn-delete" onClick={(e) => handleDelete(e, p._id)}>Delete</button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ABOUT VIEW */}
        {view === "about" && (
          <div className="page-container">
            <h2 style={{color: '#2e7d32'}}>Our Story</h2>
            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070" style={{width:'100%', borderRadius:'8px', marginBottom:'20px'}} alt="Farm" />
            <p>Established in 1985, Fabe's Farm Store began as a small roadside stand. Today, we are the trusted source for quality farming equipment and seeds.</p>
            <button onClick={() => setView("store")} className="btn-add-cart" style={{width:'auto', padding:'10px 30px'}}>Back to Shop</button>
          </div>
        )}

        {/* 3. CONTACT VIEW */}
        {view === "contact" && (
          <div className="page-container">
            <h2 style={{color: '#2e7d32'}}>Contact Us</h2>
            <p><b>Address:</b> The Barn, Springfield, IL 62704</p>
            <p><b>Phone:</b> (555) 123-4567</p>
            <p><b>Email:</b> support@fabesfarm.com</p>
            <div style={{marginTop:'20px', height:'300px', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px'}}>
               (Map Placeholder)
            </div>
          </div>
        )}

        {/* 4. LOGIN VIEW */}
        {view === "login" && (
          <div className="page-container" style={{maxWidth:'400px'}}>
            <h2>Sign In</h2>
            <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input className="admin-input" placeholder="Username" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
              <input className="admin-input" type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
              <button type="submit" className="btn-save">Sign In / Register</button>
            </form>
            <p style={{fontSize:'0.9rem', color:'#777', marginTop:'20px'}}>Try <b>admin</b> / <b>123</b> for Admin Tools.</p>
          </div>
        )}

        {/* 5. DETAILS VIEW */}
        {view === "details" && selectedProduct && (
          <div className="page-container" style={{maxWidth:'1000px'}}>
            <button onClick={() => setView("store")} style={{background:'none', border:'none', cursor:'pointer', marginBottom:'20px', color:'#777'}}>← Back to Shop</button>
            <div className="detail-view">
              <img src={selectedProduct.image} className="detail-img" alt="" />
              <div className="detail-info">
                <h1>{selectedProduct.name}</h1>
                <h2 style={{color:'#2e7d32'}}>${selectedProduct.price}</h2>
                <p>{selectedProduct.description || "No description available."}</p>
                <button className="btn-buy-now" onClick={() => handleBuyNow(selectedProduct)}>Buy Now</button>
                <button className="btn-add-cart" onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CART & CHECKOUT */}
        {(view === "cart" || view === "checkout") && (
          <div className="page-container">
            <h2>{view === "cart" ? "Your Cart" : "Checkout"}</h2>
            {cart.length === 0 ? <p>Cart is empty.</p> : (
              <div>
                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <span>{item.name}</span>
                    <div>
                      <b>${item.price}</b>
                      {view === "cart" && <button onClick={() => removeFromCart(idx)} style={{marginLeft:'10px', color:'red', border:'none', background:'none', cursor:'pointer'}}>x</button>}
                    </div>
                  </div>
                ))}
                <div className="total-section">Total: ${totalPrice.toFixed(2)}</div>
                
                {view === "cart" ? (
                  <button onClick={() => setView("checkout")} className="btn-save" style={{width:'100%', marginTop:'20px'}}>Proceed to Checkout</button>
                ) : (
                  <form onSubmit={(e) => {e.preventDefault(); alert("Order Placed!"); setCart([]); setView("store");}} style={{marginTop:'20px'}}>
                    <h3>Shipping Info</h3>
                    <input className="admin-input" placeholder="Full Name" required style={{marginBottom:'10px', width:'100%'}} />
                    <input className="admin-input" placeholder="Address" required style={{marginBottom:'10px', width:'100%'}} />
                    <button className="btn-save" style={{width:'100%'}}>Confirm Order</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="main-footer">
        &copy; 2024 Fabe's Farm Store. All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;