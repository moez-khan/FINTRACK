'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon, 
  BanknotesIcon, 
  ShieldCheckIcon, 
  ChartPieIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleAuthRedirect = (action: 'signin' | 'signup') => {
    if (session) {
      // If user is already logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // If user is not logged in, redirect to appropriate auth page
      router.push(`/auth/${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <BanknotesIcon className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                FinTrack
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : session ? (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleAuthRedirect('signin')}
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => handleAuthRedirect('signup')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Take Control of Your
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Financial Future
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Track expenses, set savings goals, and follow proven financial rules to achieve your dreams with FinTrack.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleAuthRedirect('signup')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Start Free Today
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleAuthRedirect('signin')}
                    className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    Sign In to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Manage Your Money</h2>
            <p className="text-xl text-gray-600">Powerful features designed to simplify your financial life</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expense Tracking</h3>
              <p className="text-gray-600">Categorize and monitor your spending habits with detailed insights and real-time updates.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrophyIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Savings Goals</h3>
              <p className="text-gray-600">Set SMART financial goals and track your progress with visual indicators and milestones.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ChartPieIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visual Analytics</h3>
              <p className="text-gray-600">Beautiful charts and graphs to visualize your financial data and spending patterns.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Bank-level security with encrypted data storage and secure authentication.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget Rules</h3>
              <p className="text-gray-600">Follow proven methods like 50/30/20 rule and Pay Yourself First strategy.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <DevicePhoneMobileIcon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Responsive</h3>
              <p className="text-gray-600">Access your finances anywhere with our fully responsive design on any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Rules Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proven Financial Strategies</h2>
            <p className="text-xl text-gray-600">Choose from popular budgeting methods that work</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">50/30/20 Rule</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-2 bg-blue-600 rounded"></div>
                  <span className="ml-3 text-gray-700">50% Needs</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-2 bg-orange-600 rounded"></div>
                  <span className="ml-3 text-gray-700">30% Wants</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-2 bg-green-600 rounded"></div>
                  <span className="ml-3 text-gray-700">20% Savings</span>
                </div>
              </div>
              <p className="text-gray-600">Balance your budget with this time-tested allocation strategy.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-purple-900 mb-4">Pay Yourself First</h3>
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-10 w-10 text-white" />
                </div>
              </div>
              <p className="text-gray-600">Prioritize savings by automatically setting aside money before expenses.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-green-900 mb-4">SMART Goals</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Specific</span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Measurable</span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Achievable</span>
                </div>
              </div>
              <p className="text-gray-600">Set and achieve financial goals with this structured approach.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose FinTrack?</h2>
            <p className="text-xl text-indigo-100">Join thousands who have transformed their financial lives</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-indigo-200">Free to Start</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-indigo-200">Access Your Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">256-bit</div>
              <div className="text-indigo-200">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">5 min</div>
              <div className="text-indigo-200">Quick Setup</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your journey to financial freedom today. No credit card required.
          </p>
          {session ? (
            <button 
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl text-lg"
            >
              Access Your Dashboard
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleAuthRedirect('signup')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl text-lg"
              >
                Create Free Account
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <p className="mt-4 text-sm text-gray-500">
                Already have an account? <button onClick={() => handleAuthRedirect('signin')} className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in here</button>
              </p>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BanknotesIcon className="h-8 w-8 text-indigo-400" />
                <span className="text-xl font-bold">FinTrack</span>
              </div>
              <p className="text-gray-400">Your personal finance companion</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="#guides" className="hover:text-white">Guides</Link></li>
                <li><Link href="#help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="#privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FinTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}