'use client'
import { mockAuthService } from "@/src/services/mockAuthService";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/utils/AuthContext'
import { apiService } from '@/src/services/apiService'
import { api_url } from '@/src/constants/api_url'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { notification } from '@/src/services/notificationService'
import { decodeToken } from '@/src/utils/jwt';
import { Eye, EyeClosed, LogIn } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { isAuthenticated, isAuthLoading, login } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isAuthLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await mockAuthService.login(username, password);
  
      if(response.data.status == "OK") {
        const { accessToken, refreshToken, fullName, maskEmail, maskContactNo } = response.data.data
        const decoded = decodeToken(accessToken);
        login({
          accessToken,
          refreshToken,
          _id: decoded?.sub ?? '',
          userData: { fullName, maskEmail, maskContactNo },
          isLogin: true,
        })
        setLoading(false);
        notification.success('Login Successful', `Welcome ${fullName}!`)
        router.replace('/dashboard')
      } else {
        const msg = response.data.message;
        setError(msg);
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  if (isAuthLoading) return null

  return (
    <div className="relative h-screen w-screen bg-gradient-to-t from-indigo-50 to-blue-100">
       <div className="absolute  inset-0 bg-[url('https://dwnn5f7i77za.cloudfront.net/assets-web/login/bg-login.svg')] h-full w-full bg-contain bg-bottom bg-no-repeat z-0"></div>
       <div className="relative z-10 flex flex-col items-center justify-center h-screen w-screen min-h-screen bg-transparent ">
          <Card className="w-full md:w-[450px] shadow-lg p-8 space-y-4 mx-4">
            <div className="text-center space-y-0.5 p-0 mb-[2.4rem] mt-[0rem]">
              <div className="relative w-full flex justify-center">
                <Logo size={80}></Logo>
              </div>
              {/* <h1 className="text-3xl text-slate-800 font-semibold tracking-[0.4px]">Welcome</h1> */}
              <p className='text-md text-slate-500 tracking-[0.2px]'>Sign in to dashboard</p>
            </div>
            <div className='p-0'>
              <form onSubmit={handleLogin} className="relative">
                <div className='grid gap-6'>
                  <div className="grid gap-1">
                    <Label className='text-sm text-slate-500 font-normal tracking-[0.3px] leading-none mb-[2px]' htmlFor="username">Email / Mobile No./ Username</Label>
                    <Input
                    className='h-12 rounded-lg border border-input'
                      id="username"
                      type="text"
                      placeholder="Admin"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="relative grid gap-2">
                    <Label className='text-sm text-slate-500 font-medium tracking-[0.2px] leading-none' htmlFor="password">Password</Label>
                    <Input
                    className='h-12 rounded-lg border border-input'
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9"
                    >
                      {showPassword ? (
                        <Eye className="h-5 w-5 text-slate-600 transform transition-transform duration-300 origin-center" />
                      ) : (
                        <EyeClosed className="h-5 w-5 text-slate-600 transform transition-transform duration-300 origin-center" />
                      )}
                    </button>
                  </div>
                 
                </div>
                <div className='flex items-center my-6'>
                   {error && <p className="text-red-500 text-xs">{error}</p>}
                    <button type='button' className='text-xs font-medium  tracking-[0.2px] text-slate-600 ml-auto'>Forgot Password ?</button>
                </div>
                
                <Button type="submit" className="bg-darkblue h-12 rounded-lg w-full" disabled={loading}>
                  {/* <span className='text-md font-normal tracking-[1px]'> {loading ? 'Logging in...' : 'Login'}</span> */}
                   {loading ? 'Logging in...' : <>Login <LogIn className="w-5 h-5 font-semibold min-w-5 max-w-5 min-h-5 max-h-5 text-slate-50 ml-1" /></>}
                </Button>
              </form>
            </div>
          </Card>
       </div>
 
    </div>
   
  )
}
