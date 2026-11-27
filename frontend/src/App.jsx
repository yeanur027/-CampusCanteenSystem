import React, { useEffect, useMemo, useState } from 'react'
import {
  Utensils, ShoppingBag, Wallet, ClipboardList, LayoutDashboard, LogOut,
  Search, Plus, Minus, Trash2, X, Menu, ArrowRight, ChefHat, Package,
  Users, TrendingUp, CheckCircle2, Clock, Pencil, Coffee, Sparkles
} from 'lucide-react'

const money = value => `৳${Number(value || 0).toFixed(2)}`
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  let data = {}
  try { data = await response.json() } catch {}
  if (!response.ok) throw new Error(data.message || 'Something went wrong.')
  return data
}
const foodEmoji = product => {
  const text = `${product.name || ''} ${product.category || ''}`.toLowerCase()
  if (text.includes('cake') || text.includes('dessert')) return '🍰'
  if (text.includes('coffee')) return '☕'
  if (text.includes('juice') || text.includes('drink')) return '🥤'
  if (text.includes('sandwich')) return '🥪'
  if (text.includes('burger')) return '🍔'
  if (text.includes('fries') || text.includes('snack')) return '🍟'
  if (text.includes('pizza')) return '🍕'
  return '🍽️'
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><Utensils size={19}/></span><span>Campus<span className="brand-accent">Bite</span></span></div>
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const register = mode === 'register'
  const update = e => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST', body: JSON.stringify(form)
      })
      onLogin(result.user)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="auth-page">
    <section className="auth-art">
      <Brand />
      <div className="auth-art-copy">
        <span className="eyebrow light">YOUR CAMPUS. YOUR CRAVINGS.</span>
        <h1>Good food.<br/><em>Great days.</em></h1>
        <p>Your favourite campus meals, just a few clicks away. Fresh picks, simple ordering and a happier lunch break.</p>
        <div className="art-foods"><span>🍔</span><span>🥤</span><span>🍟</span></div>
      </div>
      <small>Campus Canteen Ordering System · Academic Demo</small>
    </section>
    <section className="auth-side">
      <div className="auth-top"><Brand/><span className="muted">Campus Canteen Ordering</span></div>
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">{register ? 'JOIN THE CAMPUS TABLE' : 'WELCOME BACK'}</span>
        <h2>{register ? 'Create your account' : 'Sign in to CampusBite'}</h2>
        <p className="muted">{register ? 'Create an account and get started with ৳500 demo credit.' : 'Fresh picks and quick checkout are waiting.'}</p>
        {register && <label>Full name<input name="name" value={form.name} onChange={update} required placeholder="Your full name"/></label>}
        <label>Email address<input type="email" name="email" value={form.email} onChange={update} required placeholder="you@university.edu"/></label>
        <label>Password<input type="password" name="password" value={form.password} onChange={update} required minLength="8" placeholder="At least 8 characters"/></label>
        {error && <div className="error">{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button>
        <p className="switch-auth">{register ? 'Already have an account?' : 'New to CampusBite?'} <button type="button" className="link-btn" onClick={() => {setMode(register?'login':'register');setError('')}}>{register?'Sign in':'Create an account'}</button></p>
        <div className="demo-box"><b>Demo accounts</b><span>Student: student@ccos.local / Student123!</span><span>Admin: admin@ccos.local / Admin123!</span></div>
      </form>
      <small className="auth-foot">A better bite between every class.</small>
    </section>
  </div>
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState('menu')
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({ items: [], subtotal: 0, discount: 0, total: 0 })
  const [orders, setOrders] = useState([])
  const [wallet, setWallet] = useState(0)
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [adminTab, setAdminTab] = useState('products')
  const [stats, setStats] = useState(null)
  const [adminOrders, setAdminOrders] = useState([])
  const [students, setStudents] = useState([])
  const [editing, setEditing] = useState(null)
  const [productForm, setProductForm] = useState({name:'',description:'',price:'',stock:'',category:'Meals',image_url:''})

  const notify = message => { setToast(message); window.clearTimeout(window.__ccosToast); window.__ccosToast = window.setTimeout(() => setToast(''), 2600) }
  const isAdmin = user?.role === 'admin'
  const filteredProducts = useMemo(() => products.filter(p =>
    (category === 'All' || (p.category || 'Popular') === category) &&
    `${p.name} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [products, category, query])
  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category || 'Popular'))], [products])
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => { api('/auth/me').then(d => { if (d.user) setUser(d.user) }).catch(() => {}).finally(() => setChecking(false)) }, [])
  useEffect(() => { if (user) { if (user.role === 'admin') { setPage('overview'); loadAdmin() } else { setPage('menu'); refreshStudentData() } } }, [user])

  async function refreshStudentData() {
    try {
      const [menu, basket, student] = await Promise.all([
        api('/menu'), api(`/cart/${user.student_id}`), api(`/students/${user.student_id}`)
      ])
      setProducts(menu); setCart(basket); setWallet(student.card_balance)
      setUser(current => current && (current.name !== student.name || Number(current.card_balance) !== Number(student.card_balance))
        ? {...current, name: student.name, card_balance: student.card_balance} : current)
    } catch (err) { notify(err.message) }
  }
  async function loadMenu() { try { setProducts(await api('/menu')) } catch (err) { notify(err.message) } }
  async function loadCart() { if (!user?.student_id) return; try { setCart(await api(`/cart/${user.student_id}`)) } catch (err) { notify(err.message) } }
  async function loadOrders() { try { setOrders(await api(`/orders/${user.student_id}`)) } catch (err) { notify(err.message) } }
  async function loadAdmin() {
    try {
      const overview = await api('/admin/overview'); setStats(overview)
      if (adminTab === 'products') await loadMenu()
      if (adminTab === 'orders') setAdminOrders(await api('/admin/orders'))
      if (adminTab === 'students') setStudents(await api('/admin/students'))
    } catch (err) { notify(err.message) }
  }
  useEffect(() => { if (user && page === 'orders') loadOrders() }, [page])
  useEffect(() => { if (isAdmin && page === 'overview') loadAdmin() }, [adminTab, page, isAdmin])

  async function logout() { try { await api('/auth/me', {method:'DELETE'}) } catch {} setUser(null); setCart({items:[],subtotal:0,discount:0,total:0}) }
  async function addToCart(productId) {
    try { const result = await api('/cart', {method:'POST',body:JSON.stringify({student_id:user.student_id,item_id:productId,quantity:1})}); setCart(result); setCartOpen(true); notify('Added to your basket') }
    catch (err) { notify(err.message) }
  }
  async function changeQuantity(item, delta) {
    try {
      if (delta > 0) {
        const result = await api('/cart',{method:'POST',body:JSON.stringify({student_id:user.student_id,item_id:item.product_id,quantity:1})}); setCart(result)
      } else if (item.quantity === 1) {
        const result = await api('/cart/remove',{method:'POST',body:JSON.stringify({student_id:user.student_id,item_id:item.product_id})}); setCart(result)
      } else {
        await api('/cart/remove',{method:'POST',body:JSON.stringify({student_id:user.student_id,item_id:item.product_id})})
        const result = await api('/cart',{method:'POST',body:JSON.stringify({student_id:user.student_id,item_id:item.product_id,quantity:item.quantity-1})}); setCart(result)
      }
    } catch (err) { notify(err.message) }
  }
  async function checkout() {
    if (!cart.items.length) return
    if (!window.confirm(`Pay ${money(cart.total)} using your simulated campus card?`)) return
    setBusy(true)
    try {
      const result = await api(`/checkout/${user.student_id}`,{method:'POST'})
      setCart({items:[],subtotal:0,discount:0,total:0}); setWallet(v => v-result.total)
      await Promise.all([loadMenu(),loadOrders()])
      setPage('orders'); setCartOpen(false); notify(`Order #${result.order_id} placed successfully!`)
    } catch (err) { notify(err.message) } finally { setBusy(false) }
  }
  async function saveProduct(e) {
    e.preventDefault(); setBusy(true)
    const body = {...productForm, price:Number(productForm.price), stock:Number(productForm.stock)}
    try {
      await api(editing ? `/admin/products/${editing.id}` : '/admin/products', {method:editing?'PUT':'POST',body:JSON.stringify(body)})
      setEditing(null); setProductForm({name:'',description:'',price:'',stock:'',category:'Meals',image_url:''})
      await loadMenu(); await loadAdmin(); notify(editing?'Product updated':'Product added')
    } catch (err) { notify(err.message) } finally { setBusy(false) }
  }
  function startEdit(product) {
    setEditing(product); setProductForm({name:product.name,description:product.description||'',price:String(product.price),stock:String(product.stock),category:product.category||'Popular',image_url:product.image_url||''})
    window.scrollTo({top:0,behavior:'smooth'})
  }
  async function deleteProduct(id) {
    if (!window.confirm('Delete this menu item?')) return
    try { await api(`/admin/products/${id}`,{method:'DELETE'}); await loadMenu(); await loadAdmin(); notify('Product deleted') } catch (err) { notify(err.message) }
  }
  async function updateOrderStatus(id,status) {
    try { await api(`/admin/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); setAdminOrders(await api('/admin/orders')); notify('Order status updated') } catch (err) { notify(err.message) }
  }
  function navigate(next) { setPage(next); setMobileNav(false); setCartOpen(false) }

  if (checking) return <div className="loading-screen"><div className="loader"/>Loading CampusBite…</div>
  if (!user) return <><AuthScreen onLogin={setUser}/>{toast && <div className="toast">{toast}</div>}</>

  return <div className="app-layout">
    <aside className={`sidebar ${mobileNav?'sidebar-open':''}`}>
      <Brand/>
      <div className="nav-caption">WORKSPACE</div>
      <nav>
        {isAdmin ? <button className={`nav-item ${page==='overview'?'active':''}`} onClick={()=>navigate('overview')}><LayoutDashboard/>Overview</button> :
          <>
            <button className={`nav-item ${page==='menu'?'active':''}`} onClick={()=>navigate('menu')}><Utensils/>Discover menu</button>
            <button className={`nav-item ${page==='orders'?'active':''}`} onClick={()=>navigate('orders')}><ClipboardList/>My orders</button>
            <button className={`nav-item ${page==='wallet'?'active':''}`} onClick={()=>navigate('wallet')}><Wallet/>Campus wallet</button>
          </>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-promo"><Sparkles size={18}/><b>Good food, good mood.</b><span>Find your next favourite campus meal.</span></div>
        <div className="profile"><div className="avatar">{(user.name||user.email||'U')[0].toUpperCase()}</div><div className="profile-info"><b>{user.name||user.email}</b><small>{isAdmin?'Administrator':'Student account'}</small></div></div>
        <button className="logout" onClick={logout}><LogOut size={16}/> Sign out</button>
      </div>
    </aside>
    {mobileNav && <div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar"><button className="mobile-toggle" onClick={()=>setMobileNav(!mobileNav)}><Menu/></button><div className="crumb">Campus / <b>{({menu:'Discover menu',orders:'My orders',wallet:'Campus wallet',overview:'Admin overview'})[page]}</b></div>
        <div className="topbar-right"><span className="open-label"><i/> Canteen ordering open</span>{!isAdmin && <button className="cart-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={19}/><span>{cartCount}</span></button>}</div>
      </header>

      {!isAdmin && page === 'menu' && <section>
        <div className="hero"><div className="hero-copy"><span className="eyebrow">FRESHLY MADE ON CAMPUS</span><h1>A little joy in<br/>every <em>bite.</em></h1><p>From quick bites to comfort meals, find something you'll love today.</p><button className="btn dark" onClick={()=>document.getElementById('menu-section')?.scrollIntoView({behavior:'smooth'})}>Explore the menu <ArrowRight size={17}/></button><div className="hero-foot"><span>✦ ✦ ✦</span> Loved by your campus community</div></div><div className="hero-visual"><div className="hero-circle"/><div className="hero-emoji">🥪</div><div className="float-card float-one">✦ Made fresh daily</div><div className="float-card float-two">Good mood food ♡</div></div></div>
        <div id="menu-section" className="section-head"><div><span className="eyebrow">WHAT ARE YOU CRAVING?</span><h2>Find your favourite</h2></div><span className="muted">{filteredProducts.length} choices</span></div>
        <div className="toolbar"><div className="categories">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c==='All'?'All items':c}</button>)}</div><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search menu…"/></label></div>
        <div className="product-grid">{filteredProducts.map(p=><article className="product-card" key={p.id}><div className={`product-visual tone-${p.id%5}`}><span className="product-category">{p.category||'Popular'}</span><span className="food-emoji">{foodEmoji(p)}</span></div><div className="product-body"><h3>{p.name}</h3><p>{p.description||'Made fresh for your campus day.'}</p><div className="product-bottom"><div><b>{money(p.price)}</b><small>{p.stock>0?`${p.stock} available`:'Sold out'}</small></div><button className="add-button" disabled={p.stock<=0} onClick={()=>addToCart(p.id)}><Plus size={19}/></button></div></div></article>)}</div>
        <div className="discount-banner"><div className="discount-icon"><Sparkles/></div><div><b>A little something extra</b><span>Spend ৳200 or more and enjoy 10% off, when eligible.</span></div><strong>AUTO APPLIED</strong></div>
      </section>}

      {!isAdmin && page === 'wallet' && <section className="content-page"><span className="eyebrow">CAMPUS CARD</span><h1>Your wallet</h1><p className="muted">Keep track of your canteen balance.</p><div className="wallet-card"><span>AVAILABLE BALANCE</span><strong>{money(wallet)}</strong><small>CampusBite prepaid card · Demo balance</small><Wallet className="wallet-watermark"/></div><div className="info-note">Payments in this academic prototype are simulated. No real money is transferred.</div></section>}

      {!isAdmin && page === 'orders' && <section className="content-page"><span className="eyebrow">YOUR FOOD JOURNEY</span><h1>Order history</h1><p className="muted">All your campus cravings, in one place.</p><div className="orders-list">{orders.length ? orders.map(o=><article className="order-card" key={o.id}><div className="order-top"><div><b>Order #{o.id}</b><small>{o.items?.length||0} item types</small></div><span className="status">{o.status}</span></div><div className="order-items">{(o.items||[]).map((i,n)=><span key={n}>{i.quantity} × {i.product_name}</span>)}</div><div className="order-total"><span>Paid {o.discount>0?`(saved ${money(o.discount)})`:''}</span><b>{money(o.total)}</b></div></article>) : <div className="empty-state"><Package size={32}/><b>No orders yet</b><span>Your next favourite meal is waiting in the menu.</span><button className="btn primary" onClick={()=>navigate('menu')}>Explore menu</button></div>}</div></section>}

      {isAdmin && page === 'overview' && <section className="content-page">
        <div className="admin-heading"><div><span className="eyebrow">CONTROL CENTRE</span><h1>Admin overview</h1><p className="muted">A clear view of your canteen operations.</p></div></div>
        <div className="stats-grid">{[['Products',stats?.products??'—',Package],['Orders',stats?.orders??'—',ClipboardList],['Students',stats?.students??'—',Users],['Revenue',money(stats?.revenue),TrendingUp]].map(([label,value,Icon])=><div className="stat-card" key={label}><span>{label}</span><b>{value}</b><small>All-time overview</small><Icon/></div>)}</div>
        <div className="admin-tabs">{[['products','Menu inventory'],['orders','Orders'],['students','Students']].map(([key,label])=><button className={adminTab===key?'active':''} key={key} onClick={()=>setAdminTab(key)}>{label}</button>)}</div>
        {adminTab==='products' && <div className="admin-grid">
          <form className="product-form" onSubmit={saveProduct}><div className="form-title"><h3>{editing?'Edit menu item':'Add a menu item'}</h3>{editing&&<button type="button" className="link-btn" onClick={()=>{setEditing(null);setProductForm({name:'',description:'',price:'',stock:'',category:'Meals',image_url:''})}}>Cancel edit</button>}</div>
            <label>Product name<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="e.g. Chicken wrap"/></label>
            <label>Description<textarea value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} placeholder="Short description"/></label>
            <div className="form-row"><label>Price (৳)<input type="number" min="0" step="0.01" required value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>Stock<input type="number" min="0" required value={productForm.stock} onChange={e=>setProductForm({...productForm,stock:e.target.value})}/></label></div>
            <label>Category<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{['Meals','Drinks','Snacks','Desserts','Popular'].map(c=><option key={c}>{c}</option>)}</select></label>
            <button className="btn primary full" disabled={busy}>{editing?'Save changes':'Add product'} <Plus size={16}/></button>
          </form>
          <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>STOCK</th><th>ACTIONS</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.category}</small></td><td>{money(p.price)}</td><td>{p.stock}</td><td><div className="row-actions"><button onClick={()=>startEdit(p)} title="Edit"><Pencil size={15}/></button><button className="delete" onClick={()=>deleteProduct(p.id)} title="Delete"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>
        </div>}
        {adminTab==='orders' && <div className="table-wrap"><table><thead><tr><th>ORDER</th><th>STUDENT</th><th>TOTAL</th><th>STATUS</th><th>UPDATE</th></tr></thead><tbody>{adminOrders.map(o=><tr key={o.id}><td>#{o.id}</td><td>{o.student_name}</td><td>{money(o.total)}</td><td><span className="status">{o.status}</span></td><td><select value={o.status} onChange={e=>updateOrderStatus(o.id,e.target.value)}>{['PAID','PREPARING','READY','COMPLETED','CANCELLED'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!adminOrders.length&&<div className="table-empty">No orders yet.</div>}</div>}
        {adminTab==='students' && <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>EMAIL</th><th>CARD BALANCE</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.email||'—'}</td><td>{money(s.card_balance)}</td></tr>)}</tbody></table>{!students.length&&<div className="table-empty">No students found.</div>}</div>}
      </section>}
    </main>

    {!isAdmin && <div className={`drawer-layer ${cartOpen?'show':''}`}><div className="drawer-scrim" onClick={()=>setCartOpen(false)}/><aside className="cart-drawer"><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your basket <small>({cartCount})</small></h2></div><button className="icon-close" onClick={()=>setCartOpen(false)}><X/></button></div>
      <div className="drawer-items">{cart.items.length ? cart.items.map(item=><div className="cart-item" key={item.product_id}><div className="cart-food">{foodEmoji(item)}</div><div className="cart-item-info"><b>{item.name}</b><small>{money(item.price)} each</small><strong>{money(item.price*item.quantity)}</strong></div><div className="qty"><button onClick={()=>changeQuantity(item,-1)}><Minus size={13}/></button><b>{item.quantity}</b><button onClick={()=>changeQuantity(item,1)}><Plus size={13}/></button></div></div>) : <div className="cart-empty"><ShoppingBag size={38}/><b>Your basket is empty</b><span>Add something delicious from the menu.</span></div>}</div>
      <div className="cart-summary"><div><span>Subtotal</span><b>{money(cart.subtotal)}</b></div><div className="saved"><span>Discount</span><b>− {money(cart.discount)}</b></div><div className="grand-total"><span>Total</span><strong>{money(cart.total)}</strong></div><button className="btn primary full" disabled={!cart.items.length||busy} onClick={checkout}>{busy?'Processing…':'Continue to checkout'} <ArrowRight size={17}/></button><small className="secure-note">Campus-card payment is simulated for this project.</small></div>
    </aside></div>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

export default App
