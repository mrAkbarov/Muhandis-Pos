
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Add, Search, Person, ArrowBack, ArrowForward } from '@mui/icons-material';
import { Button, Avatar, Chip, InputAdornment, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const itemsPerPage = 5;

export default function Agents() {
  const { agents, setAgents, currentBusinessId } = useApp();
  const [search, setSearch] = useState('');
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', phone: '', supplierName: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const businessAgents = agents.filter(a => a.businessId === currentBusinessId);

  const handleSaveAgent = () => {
    if (!agentForm.name || !agentForm.phone || !agentForm.supplierName) return;
    const newAgent = {
      id: Date.now(),
      name: agentForm.name,
      phone: agentForm.phone,
      supplierName: agentForm.supplierName,
      businessId: currentBusinessId
    };
    setAgents(prev => [...prev, newAgent]);
    setAgentForm({ name: '', phone: '', supplierName: '' });
    setOpenAgentDialog(false);
  };

  const avatarColor = (name) => {
    const colors = ['#4361ee', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filteredAgents = businessAgents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agentlar Tizimi</h1>
          <p className="text-sm text-gray-500">Agentlar ro'yxati va ularni boshqarish</p>
        </div>
        <div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAgentDialog(true)}
            sx={{ bgcolor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#3451d1' } }}
          >
            Yangi Agent
          </Button>
        </div>
      </div>

      {/* Filtering */}
      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Agent qidirish..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9ca3af' }} /></InputAdornment>,
          }}
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700, fontSize: 12, color: '#6b7280', py: 1.5 } }}>
                <TableCell>Agent ismi</TableCell>
                <TableCell>Kompaniya / Agentlik</TableCell>
                <TableCell>Telefon raqami</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                    <Person className="mb-2 text-gray-300" style={{ fontSize: 40 }} />
                    <p className="text-sm">Agentlar mavjud emas</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedList.map((a, index) => {
                  const isEven = index % 2 === 1;
                  return (
                    <TableRow 
                      key={a.id} 
                      hover 
                      sx={{ 
                        '& td': { py: 1.5, fontSize: 13 },
                        bgcolor: isEven ? '#f4f9ff' : 'white',
                        '&:hover': { bgcolor: '#eaf4ff !important' }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: avatarColor(a.name) }}>
                            {a.name.charAt(0)}
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-800">{a.name}</p>
                            <p className="text-xs text-gray-400">ID: {a.id.toString().slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={a.supplierName || 'Kompaniya kiritilmagan'} 
                          size="small" 
                          sx={{ fontSize: 11, bgcolor: '#eef0ff', color: '#4361ee', fontWeight: 600 }} 
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#4b5563', fontWeight: 500 }}>{a.phone}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-500">
            Jami {filteredAgents.length} tadan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAgents.length)} ko'rsatilmoqda
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Oldingi
            </Button>
            <span className="text-xs font-semibold px-2 py-1 bg-white border rounded">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              endIcon={<ArrowForward />}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Keyingi
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog for adding Agent */}
      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, borderBottom: '1px solid #f1f5f9', pb: 2 }}>Yangi Agent Qo'shish</DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Agent Ismi"
            value={agentForm.name}
            onChange={(e) => setAgentForm(f => ({ ...f, name: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <TextField
            label="Kompaniya / Agentlik"
            value={agentForm.supplierName}
            onChange={(e) => setAgentForm(f => ({ ...f, supplierName: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
          <TextField
            label="Telefon raqami"
            value={agentForm.phone}
            onChange={(e) => setAgentForm(f => ({ ...f, phone: e.target.value }))}
            size="small"
            fullWidth
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setOpenAgentDialog(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Bekor qilish</Button>
          <Button onClick={handleSaveAgent} variant="contained"
            sx={{ bgcolor: '#4361ee', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#3451d1' } }}>
            Agentni Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
