'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/utils/AuthContext'
import { apiService } from '@/src/services/apiService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { notification } from '@/src/services/notificationService'
import { Eye, EyeClosed, LogIn } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { isAuthenticated, isAuthLoading, login } = useAuth()

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace('/reference-data')
    }
  }, [isAuthenticated, isAuthLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiService.post({
        path: '/api/auth/login',
        data: {
          email,
          password,
        },
      })

      const { user } = response.data as { user: { id: string; email: string; role: string } }

      login({
        id: user.id,
        email: user.email,
        role: user.role,
      })
      setLoading(false)
      notification.success('Login Successful', `Welcome back!`)
      router.replace('/reference-data')
    } catch (error: any) {
      setLoading(false)
      if (error?.response?.status === 401) {
        setError('Invalid credentials. Please try again.')
        return
      }
      setError('Something went wrong. Please try again.')
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
                    <Label className='text-sm text-slate-500 font-normal tracking-[0.3px] leading-none mb-[2px]' htmlFor="username">Email</Label>
                    <Input
                    className='h-12 rounded-lg border border-input'
                      id="username"
                      type="email"
                      placeholder="admin@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
