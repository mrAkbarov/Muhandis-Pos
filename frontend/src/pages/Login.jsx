import { useState } from 'react';
import { PointOfSale, Visibility, VisibilityOff, LockOutlined, Person } from '@mui/icons-material';
import { Alert, Button, IconButton, InputAdornment, TextField } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../config/roles';
import { useNavigate } from 'react-router-dom';
import { PRIMARY_COLOR } from '../config/constants';
import BrandLogo from '../components/brand/BrandLogo';
import { BRAND_NAME } from '../config/brand';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#f8fafc',
    fontSize: 15,
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY_COLOR },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      navigate(getHomePath(result.user.role), { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Chap panel — brend */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a2035 0%, #252d4a 55%, #4361ee 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="absolute bottom-20 -left-16 w-48 h-48 rounded-full opacity-5" style={{ background: '#fff' }} />

        <div className="relative z-10">
          <BrandLogo size={30} />
        </div>

        <div className="relative z-10 space-y-4 max-w-sm">
          <h2 className="text-3xl font-bold leading-tight">
            Do'kon boshqaruvi va kassa tizimi
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Sotuv, sklad va hisobotlarni bitta platformada boshqaring.
          </p>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © {BRAND_NAME}
        </p>
      </div>

      {/* O'ng panel — forma */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#f0f2f5]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <BrandLogo size={28} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Kirish</h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Tizimga kirish uchun login va parolingizni kiriting
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2, fontSize: 13 }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                autoComplete="username"
                autoFocus
                margin="normal"
                sx={{ ...inputSx, mt: 0, mb: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person style={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Parol"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="current-password"
                margin="normal"
                sx={{ ...inputSx, mt: 2, mb: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined style={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label="Parolni ko'rsatish"
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" style={{ color: '#94a3b8' }} />
                        ) : (
                          <Visibility fontSize="small" style={{ color: '#94a3b8' }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 1,
                  py: 1.5,
                  fontSize: 15,
                  bgcolor: PRIMARY_COLOR,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(67, 97, 238, 0.35)',
                  '&:hover': {
                    bgcolor: '#3451d1',
                    boxShadow: '0 6px 20px rgba(67, 97, 238, 0.4)',
                  },
                }}
              >
                {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
              </Button>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Demo loginlar (parol: 123)</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-gray-600">
                  <p><span className="font-mono text-gray-800">superadmin</span> — platform egasi (faqat ko&apos;rish + magazinlar holati)</p>
                  <p><span className="font-mono text-gray-800">m001.admin</span> — Magazin 001 admini (o&apos;zgartira oladi)</p>
                  <p><span className="font-mono text-gray-800">m001.manager</span> — Magazin 001 menejeri</p>
                  <p><span className="font-mono text-gray-800">m001.kassir1</span> — Magazin 001 kassiri</p>
                  <p className="text-gray-400">m002, m003 … m100 — har magazin alohida</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
