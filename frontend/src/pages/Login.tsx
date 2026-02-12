export default function Login() {
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:3000/auth/google";
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center border-t-4 border-blue-500">
            {/* Main Card */}
            <div className="w-full max-w-[400px] bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Login</h2>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-medium h-12 rounded transition-all mb-6"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Login with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 bg-white text-gray-400 text-xs uppercase tracking-wider">or sign up through email</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <input
                            type="email"
                            placeholder="Email ID"
                            className="w-full h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-gray-400"
                        />
                    </div>

                    <button
                        onClick={handleGoogleLogin} // Reuse google login for demo purposes as per assignment scope
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-10 rounded transition-colors"
                    >
                        Login
                    </button>

                </div>
            </div>
        </div>
    );
}
