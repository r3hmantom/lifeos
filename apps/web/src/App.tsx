import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Schedule from './pages/Schedule'
import Goals from './pages/Goals'
import Memories from './pages/Memories'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/schedule" replace />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
