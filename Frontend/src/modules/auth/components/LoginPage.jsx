import React, { useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaUser, FaLock, FaChartLine, FaHandshake, FaGlobe, FaRocket, FaUsers, FaBriefcase, FaLightbulb, FaBullhorn, FaLaptopCode, FaBuilding } from 'react-icons/fa'
import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'
import urbancodeLogo from '@assets/Urbancode.webp'
import './LoginPage.css'

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post(endpoints.auth.login, {
        username,
        password,
      })
      const result = response.data

      if (response.status === 200 && result.user) {
        toast.success('Login successful!')

        if (onLoginSuccess) {
          onLoginSuccess()
        }
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'Network error. Please check your connection and try again.'
      console.error('Login error:', error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <div className="area min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      <Toaster position="top-right" />
      
      {/* Animated Background Icons */}
      <ul className="circles">
        <li><FaChartLine /></li>
        <li><FaUsers /></li>
        <li><FaHandshake /></li>
        <li><FaGlobe /></li>
        <li><FaRocket /></li>
        <li><FaBriefcase /></li>
        <li><FaLightbulb /></li>
        <li><FaBullhorn /></li>
        <li><FaLaptopCode /></li>
        <li><FaBuilding /></li>
      </ul>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl border border-white/20 backdrop-blur-md">
          
          <div className="flex flex-col items-center mb-6">
             {/* Logo */}
             <img src={urbancodeLogo} alt="UrbanCode Logo" className="w-40 mb-4 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300 bg-white p-2" />
             <h2 className="text-3xl font-bold text-center text-white mb-2 drop-shadow-md">Zen Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-blue-100 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type="text"
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/30 rounded-lg leading-5 bg-white/20 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 sm:text-sm backdrop-blur-sm shadow-inner"
                placeholder="Username"
                disabled={isLoading}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-blue-100 group-focus-within:text-white transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-white/30 rounded-lg leading-5 bg-white/20 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 sm:text-sm backdrop-blur-sm shadow-inner"
                placeholder="Password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-100 hover:text-white transition-colors focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-blue-100 font-medium">
              © {new Date().getFullYear()} UrbanCode. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
