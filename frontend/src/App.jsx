import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// === THIS IS YOUR LIVE BACKEND URL ===
const API_URL = "https://newfabes-farm-store.onrender.com";

function App() {
  // === STATE MANAGEMENT ===
  const [view, setView] = useState("home"); 
  const [products, setProducts] = useState([]);
  
  // Cart State (Persisted)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // User State (Persisted)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // SEARCH & FILTER STATE
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  
  // Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "", price: "", category: "", description: "", image: ""
  });
  
  // EDITING STATE (Tracks if we are editing a product ID)
  const [editingId, setEditingId] = useState(null);

  // Checkout Form State
  const [checkoutData, setCheckoutData] = useState({
    fullName: "", address: "", card: "", zip: ""
  });

  // === EFFECTS ===
  useEffect(() => { refreshProducts(); }, []);
  useEffect(() => { localStorage.setItem("cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const refreshProducts = () => {
    axios.get(`${API_URL}/api/products`)
      .then(response => setProducts(response.data))
      .catch(error => console.error("Error fetching data:", error));
  };

  // === HANDLERS ===
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === "admin" && loginData.password === "123") {
      setUser({ name: "Administrator", role: "admin" });
      setView("admin"); 
    } else {
      setUser({ name: loginData.username, role: "user" });
      setView("store"); 
    }
    setLoginData({ username: "", password: "" }); 
  };

  const handleLogout = () => {
    setUser(null);
    setView("home");
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    alert("Added to cart!");
  };

  const handleBuyNow = (product) => {
    const confirmBuy = window.confirm(`Buy ${product.name} now? This will take you to checkout.`);
    if (confirmBuy) {
      if (!cart.find(p => p._id === product._id)) {
         setCart([...cart, product]);
      }
      setView("checkout");
    }
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if(cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    alert(`Thank you ${checkoutData.fullName}! Your order for $${total.toFixed(2)} has been placed.`);
    setCart([]); 
    setCheckoutData({ fullName: "", address: "", card: "", zip: "" });
    setView("home");
  };

  const handleDeleteProduct = (id) => {
    if(!window.confirm("Are you sure you want to delete this?")) return;
    axios.delete(`${API_URL}/api/products/${id}`)
      .then(() => refreshProducts())
      .catch(err => alert("Error deleting: " + err));
  };

  const handleEditProduct = (product) => {
    setNewProduct(product); 
    setEditingId(product._id); 
    window.scrollTo(0,0); 
  };

  const handleCancelEdit = () => {
    setNewProduct({ name: "", price: "", category: "", description: "", image: "" });
    setEditingId(null);
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault(); 
    if (editingId) {
      axios.put(`${API_URL}/api/products/${editingId}`, newProduct)
        .then(() => {
          alert("Product Updated!");
          handleCancelEdit(); 
          refreshProducts();
        })
        .catch(err => alert("Error updating: " + err));
    } else {
      axios.post(`${API_URL}/api/products`, newProduct)
        .then(() => {
          alert("Product Added!");
          handleCancelEdit(); 
          refreshProducts();
        })
        .catch(err => alert("Error adding: " + err));
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setView("details");
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  // === NEW FILTER LOGIC (SEARCH + CATEGORY) ===
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || (product.category && product.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // EXTRACT UNIQUE CATEGORIES FOR DROPDOWN
  const categories = ["All Categories", ...new Set(products.map(p => p.category).filter(Boolean))];

  const getDeliveryDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="app-container">
      
      {/* === TOP UTILITY BAR === */}
      <div className="top-bar">
        <div>
          {user ? (
            <span>Hi, <b>{user.name}</b>! (<span onClick={handleLogout} className="link-action">Sign out</span>)</span>
          ) : (
            <span>Hi! <span onClick={() => setView("login")} className="link-action">Sign in</span> or <span onClick={() => setView("login")} className="link-action">register</span></span>
          )}
        </div>
      </div>

      {/* === MAIN HEADER === */}
      <header className="main-header">
        <div className="logo" onClick={() => setView("home")}>
          <span style={{color: '#e53238'}}>F</span><span style={{color: '#0064d2'}}>a</span><span style={{color: '#f5af02'}}>b</span><span style={{color: '#86b817'}}>e</span><span style={{color: '#e53238'}}>'</span><span style={{color: '#0064d2'}}>s</span>
          <span style={{color: '#333'}}> </span>
          <span style={{color: '#f5af02'}}>F</span><span style={{color: '#86b817'}}>a</span><span style={{color: '#e53238'}}>r</span><span style={{color: '#0064d2'}}>m</span>
        </div>
        
        {/* === NEW: CATEGORY DROPDOWN + SEARCH === */}
        <div className="search-bar-container" style={{display:'flex', alignItems:'center', border:'2px solid #333', borderRadius:'4px', overflow:'hidden'}}>
            <select 
              value={selectedCategory} 
              onChange={(e) => { setSelectedCategory(e.target.value); setView("store"); }}
              style={{
                padding: '10px', 
                backgroundColor: '#f8f8f8', 
                border: 'none', 
                borderRight: '1px solid #ccc',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '150px'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input 
              type="text" 
              className="search-input"
              style={{border: 'none', outline: 'none', flex: 1}}
              placeholder="Search for items..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if(view !== "store") setView("store"); }} 
            />
            
            <div style={{padding: '0 15px', color: '#333', cursor: 'pointer'}} onClick={() => setView("store")}>
              🔍
            </div>
        </div>

        <nav className="nav-links">
          <button onClick={() => setView("home")} className="nav-btn">Home</button>
          <button onClick={() => setView("store")} className="nav-btn">Shop</button>
          <button onClick={() => setView("cart")} className="nav-btn">Cart ({cart.length})</button>
          {user && user.role === 'admin' && ( 
            <button onClick={() => setView("admin")} className="nav-btn admin-btn">Admin</button> 
          )}
        </nav>
      </header>

      {/* === MAIN CONTENT === */}
      <main>
        {/* Login View */}
        {view === "login" && (
          <div className="login-container">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin} className="login-form">
              <input type="text" placeholder="Username" value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} required />
              <input type="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
              <button type="submit" className="search-btn" style={{width: '100%'}}>Sign In</button>
            </form>
          </div>
        )}

        {/* Home View */}
        {view === "home" && (
          <div className="home-container">
            <h1 style={{fontSize: '2.5rem', marginBottom: '20px'}}>Welcome to Fabe's Farm Store</h1>
            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop" alt="Farm Banner" className="banner-img" />
            
            <div className="about-section">
              <h2>Our Story</h2>
              <p>
                Established in 1985, Fabe's Farm Store began as a small roadside stand in Springfield, Illinois. 
                Founded by "Farmer Fabe," our mission has always been simple: <strong>connect the community with the land.</strong>
              </p>
              <p>
                Today, we are the region's trusted source for high-quality seeds, reliable tractor parts, and fresh organic produce. 
                Whether you are running a 500-acre operation or just planting your first backyard garden, we have the tools and expertise you need.
              </p>
            </div>

            <div><button onClick={() => setView("store")} className="cta-btn">Start Shopping</button></div>
          </div>
        )}

        {/* Product Details View */}
        {view === "details" && selectedProduct && (
          <div>
            <button onClick={() => setView("store")} className="back-link">&lt; Back to search results</button>
            <div className="details-container">
              <div className="image-section">
                 <img src={selectedProduct.image} alt={selectedProduct.name} style={{width: '100%', maxHeight: '500px', objectFit: 'contain'}} onError={(e) => {e.target.src = "https://placehold.co/400?text=No+Image"}} />
              </div>
              <div className="info-section">
                  <h1 style={{fontSize: '1.4rem', borderBottom: '1px solid #eee', paddingBottom: '15px'}}>{selectedProduct.name}</h1>
                  <div style={{marginBottom: '20px', fontSize: '0.9rem'}}><span style={{fontWeight: 'bold'}}>Seller:</span> FarmDirect <span style={{color: '#0654ba'}}>(98.8% positive)</span></div>
                  
                  <div className="price-box">
                      <div style={{marginBottom: '10px', fontSize: '1.5rem', fontWeight: 'bold'}}>US ${selectedProduct.price}</div>
                      <div style={{marginBottom: '20px', color: '#555', fontSize: '0.9rem'}}>Condition: <span style={{fontWeight: 'bold', color: '#333'}}>Brand New</span></div>
                      <div className="action-buttons">
                          <button onClick={() => handleBuyNow(selectedProduct)} className="btn-buy">Buy It Now</button>
                          <button onClick={() => addToCart(selectedProduct)} className="btn-cart">Add to cart</button>
                      </div>
                  </div>
                  
                  <div style={{marginTop: '30px', fontSize: '0.9rem', color: '#333'}}>
                    <div style={{display: 'flex', marginBottom: '12px'}}>
                      <span style={{width: '100px', color: '#777'}}>Shipping:</span>
                      <div style={{flex: 1}}><span style={{fontWeight: 'bold'}}>US $12.50</span> Fabe's Express Rural Delivery.</div>
                    </div>
                    <div style={{display: 'flex', marginBottom: '12px'}}>
                      <span style={{width: '100px', color: '#777'}}>Located in:</span>
                      <div>The Barn, Springfield, IL, United States</div>
                    </div>
                    <div style={{display: 'flex', marginBottom: '12px'}}>
                      <span style={{width: '100px', color: '#777'}}>Delivery:</span>
                      <div>Estimated between <span style={{fontWeight: 'bold'}}>{getDeliveryDate(3)}</span> and <span style={{fontWeight: 'bold'}}>{getDeliveryDate(6)}</span>.</div>
                    </div>
                  </div>

                  {/* === NEW: DESCRIPTION, SELLER & FEEDBACK SECTIONS === */}
                  
                  <hr style={{ margin: "30px 0", border: "0", borderTop: "1px solid #e1e1e1" }} />

                  {/* 1. ITEM DESCRIPTION SECTION */}
                  <div className="product-description-section">
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
                      Item Description
                    </h3>
                    <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333" }}>
                      {selectedProduct.description ? selectedProduct.description : "No description available for this product."}
                    </p>
                  </div>

                  <hr style={{ margin: "30px 0", border: "0", borderTop: "1px solid #e1e1e1" }} />

                  {/* 2. ABOUT THE SELLER SECTION */}
                  <div className="about-seller-section">
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
                      About the Seller
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                      <div style={{ 
                        width: "50px", 
                        height: "50px", 
                        backgroundColor: "#2c3e50", 
                        color: "white",
                        borderRadius: "50%", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        fontWeight: "bold"
                      }}>
                        FD
                      </div>
                      <div>
                        <p style={{ fontWeight: "bold", margin: "0" }}>FarmDirect</p>
                        <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>98.8% Positive Feedback</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "14px", color: "#555" }}>
                      We are a family-owned business located in Springfield, IL. We specialize in high-quality farm tools and locally sourced seeds. We ship daily!
                    </p>
                  </div>

                  <hr style={{ margin: "30px 0", border: "0", borderTop: "1px solid #e1e1e1" }} />

                  {/* 3. SELLER FEEDBACK SECTION */}
                  <div className="seller-feedback-section">
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
                      Seller Feedback
                    </h3>
                    
                    <div style={{ marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                      <div style={{ color: "#f39c12", marginBottom: "5px" }}>★★★★★</div>
                      <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>Exactly what I needed!</p>
                      <p style={{ fontSize: "14px", color: "#555", margin: "0" }}>
                        "Very sturdy and arrived 2 days early. Highly recommend this seller."
                      </p>
                      <p style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>- John D.</p>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ color: "#f39c12", marginBottom: "5px" }}>★★★★☆</div>
                      <p style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>Good value</p>
                      <p style={{ fontSize: "14px", color: "#555", margin: "0" }}>
                        "Good product for the price. Packaging was a bit damaged but item was fine."
                      </p>
                      <p style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>- Sarah M.</p>
                    </div>
                  </div>
                  {/* === END NEW SECTIONS === */}

              </div>
            </div>
          </div>
        )}

        {/* Shop Store View */}
        {view === "store" && (
          <div className="store-wrapper">
             {/* Show what is being searched/filtered */}
             {(searchTerm || selectedCategory !== "All Categories") && (
               <div style={{marginBottom: '15px', fontSize: '1.1rem'}}>
                  Showing results for: <b>{selectedCategory}</b> {searchTerm && <span> matching "<b>{searchTerm}</b>"</span>}
               </div>
             )}

            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product._id} className="product-card" onClick={() => openProductDetails(product)}>
                    <img src={product.image} alt={product.name} onError={(e) => {e.target.src = "https://placehold.co/200?text=No+Image"}} />
                    <h3 style={{fontSize: '1rem', color: '#333', marginBottom: '5px', textDecoration: 'underline'}}>{product.name}</h3>
                    <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>${product.price}</div>
                  </div>
                ))
              ) : (
                <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '50px'}}>
                  <h3>No products found.</h3>
                  <button onClick={() => {setSearchTerm(""); setSelectedCategory("All Categories");}} className="cta-btn">Clear Filters</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart View */}
        {view === "cart" && (
          <div className="cart-container">
            <h2>Your Shopping Cart</h2>
            {cart.length === 0 ? <p>Your cart is empty.</p> : (
              <>
                {cart.map((item, index) => ( 
                  <div key={index} className="cart-item">
                    <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                      <img src={item.image} style={{width:'50px', height:'50px', objectFit:'cover'}} alt="" />
                      <span>{item.name}</span>
                    </div>
                    <div style={{display:'flex', alignItems:'center'}}>
                       <span style={{fontWeight: 'bold', marginRight: '15px'}}>${item.price}</span>
                       <button onClick={() => removeFromCart(index)} className="btn-remove">Remove</button>
                    </div>
                  </div> 
                ))}
                <div className="cart-total-section">
                  <p style={{marginTop: '20px', fontWeight:'bold'}}>Total: ${totalPrice.toFixed(2)}</p>
                  <button onClick={() => setView("checkout")} className="btn-buy" style={{fontSize: '1rem', padding: '15px 40px'}}>Proceed to Checkout</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Checkout View */}
        {view === "checkout" && (
          <div className="checkout-container">
            <button onClick={() => setView("cart")} className="back-link">Back to Cart</button>
            <h2 style={{textAlign:'center', marginBottom: '20px'}}>Secure Checkout</h2>
            <div style={{textAlign:'center', marginBottom: '20px', fontWeight: 'bold'}}>Total Due: ${totalPrice.toFixed(2)}</div>
            <form onSubmit={handlePlaceOrder} className="checkout-form">
               <label>Full Name</label>
               <input required placeholder="John Doe" value={checkoutData.fullName} onChange={e => setCheckoutData({...checkoutData, fullName: e.target.value})} />
               <label>Shipping Address</label>
               <input required placeholder="123 Farm Lane" value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})} />
               <label>Credit Card Number</label>
               <input required placeholder="0000 0000 0000 0000" value={checkoutData.card} onChange={e => setCheckoutData({...checkoutData, card: e.target.value})} />
               <div style={{display: 'flex', gap: '10px'}}>
                 <div style={{flex:1}}>
                   <label>Zip Code</label>
                   <input required placeholder="12345" value={checkoutData.zip} onChange={e => setCheckoutData({...checkoutData, zip: e.target.value})} />
                 </div>
                 <div style={{flex:1}}>
                   <label>CVV</label>
                   <input required placeholder="123" />
                 </div>
               </div>
               <button type="submit" className="btn-place-order">Pay ${totalPrice.toFixed(2)}</button>
            </form>
          </div>
        )}

        {/* Admin View */}
        {view === "admin" && (
          <div className="admin-container">
             <h2>Admin Dashboard</h2>
             
             <div className="admin-form-wrapper" style={{marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
               <h3>{editingId ? `Editing: ${newProduct.name}` : "Add New Product"}</h3>
               <form onSubmit={handleSubmitProduct}>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                   <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required style={{flex: 2}} />
                   <input placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required style={{flex: 1}} />
                   <input placeholder="Category (e.g. Tools, Fruits)" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{flex: 1}} />
                </div>
                <input placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{marginBottom: '10px', width:'100%'}} />
                <input placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} required style={{marginBottom: '10px', width:'100%'}} />
                
                <div style={{display:'flex', gap:'10px'}}>
                  <button type="submit" style={{backgroundColor: editingId ? '#f5af02' : 'green', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight:'bold'}}>
                    {editingId ? "Update Product" : "Add Product"}
                  </button>
                  
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} style={{backgroundColor: '#999', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  )}
                </div>
               </form>
             </div>

             <h3>Current Inventory</h3>
             <div className="inventory-list">
               <div className="inventory-header" style={{display:'flex', fontWeight:'bold', padding:'10px', borderBottom:'2px solid #333'}}>
                 <div style={{flex:2}}>Name</div>
                 <div style={{flex:1}}>Price</div>
                 <div style={{flex:1, textAlign:'right'}}>Actions</div>
               </div>
               {products.map(p => ( 
                 <div key={p._id} className="inventory-item" style={{display:'flex', padding:'10px', borderBottom:'1px solid #eee', alignItems:'center'}}>
                   <div style={{flex:2}}>{p.name}</div>
                   <div style={{flex:1}}>${p.price}</div>
                   <div style={{flex:1, textAlign:'right'}}>
                     <button onClick={() => handleEditProduct(p)} style={{color: '#0053a0', cursor: 'pointer', border: 'none', background: 'none', marginRight:'15px', textDecoration:'underline'}}>Edit</button>
                     <button onClick={() => handleDeleteProduct(p._id)} style={{color: 'red', cursor: 'pointer', border: 'none', background: 'none', textDecoration:'underline'}}>Delete</button>
                   </div>
                 </div> 
               ))}
             </div>
          </div>
        )}
      </main>

      {/* === MAIN FOOTER === */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>About Fabe's Farm Store</h3>
            <p>Founded in 2024, Fabe's Farm Store is dedicated to providing the highest quality farming equipment, seeds, and fresh produce to our local community. Connecting you to the land.</p>
          </div>
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul>
              <li><b>Email:</b> support@fabesfarmstore.com</li>
              <li><b>Phone:</b> +1 (555) 123-4567</li>
              <li style={{marginTop: '15px'}}><b>Follow us:</b></li>
              <li className="social-links" style={{marginTop: '5px'}}>
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
             <h3>Our Location</h3>
             <p>The Barn, Springfield, IL 62704</p>
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.5667!2d-89.650148!3d39.781721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x887539c1d8400001%3A0x0!2zMznCsDQ2JzU0LjIiTiA4OcKwMzknMDAuNSJX!5e0!3m2!1sen!2sus!4v1234567890" 
               className="map-frame"
               allowFullScreen="" 
               loading="lazy"
             ></iframe>
          </div>
        </div>
        <div className="copyright">
          Copyright © 2024 Fabe's Farm Store Inc. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;