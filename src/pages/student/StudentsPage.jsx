import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Modal, PageHeader } from '../../components/common/UIComponents';
import StudentIdCard from '../../components/StudentIdCard';
import toast from 'react-hot-toast';

const STUDENTS = [
  { id: 1, name: 'John Doe', class: 'Form 2A', serial: 'STU2024001', reg: 'REG2024001', gender: 'Male', avg: 85, status: 'active' },
  { id: 2, name: 'Jane Smith', class: 'Form 2A', serial: 'STU2024002', reg: 'REG2024002', gender: 'Female', avg: 78, status: 'active' },
  { id: 3, name: 'Bob Johnson', class: 'Form 3A', serial: 'STU2024003', reg: 'REG2024003', gender: 'Male', avg: 92, status: 'active' },
  { id: 4, name: 'Alice Brown', class: 'Form 1A', serial: 'STU2024004', reg: 'REG2024004', gender: 'Female', avg: 88, status: 'active' },
  { id: 5, name: 'Charlie Wilson', class: 'Form 4B', serial: 'STU2024005', reg: 'REG2024005', gender: 'Male', avg: 72, status: 'inactive' },
];

export const StudentsPage = () => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = STUDENTS.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.serial.includes(search)) &&
    (classFilter === '' || s.class === classFilter)
  );

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${STUDENTS.length} total students`}
        action={<Button variant="primary" onClick={() => setModal('add')}>➕ Add Student</Button>}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input className="sms-input" style={{ paddingLeft: '2.4rem' }} placeholder="Search by name or serial..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sms-input sms-select" style={{ width: 160 }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {[...new Set(STUDENTS.map(s => s.class))].map(c => <option key={c}>{c}</option>)}
        </select>
        <Button variant="ghost" size="sm">📥 Export</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="sms-card">
        <div className="sms-table-wrap">
          <table className="sms-table">
            <thead>
              <tr>
                <th>#</th><th>Student</th><th>Class</th><th>Serial No.</th><th>Reg. No.</th><th>Gender</th><th>Avg Score</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563eb18', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{s.name.split(' ').map(n => n[0]).join('')}</div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td><span className="sms-badge sms-badge-primary">{s.class}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.serial}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.reg}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.gender}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.avg >= 80 ? '#16a34a' : s.avg >= 60 ? '#d97706' : '#dc2626' }}>{s.avg}%</span>
                  </td>
                  <td><span className={`sms-badge ${s.status === 'active' ? 'sms-badge-success' : 'sms-badge-danger'}`}>{s.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Button variant="outline" size="sm" onClick={() => { setSelected(s); setModal('view'); }}>View</Button>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <div>No students found</div>
          </div>
        )}
      </motion.div>

      {/* View Student Modal */}
      {selected && (
        <Modal isOpen={modal === 'view'} onClose={() => setModal(null)} title="👨🎓 Student Details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2563eb18', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>{selected.name.split(' ').map(n => n[0]).join('')}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{selected.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{selected.class} · {selected.gender}</div>
            </div>
          </div>

          <StudentIdCard student={selected} />

          {[
            ['Serial Number', selected.serial],
            ['Registration Number', selected.reg],
            ['Class', selected.class],
            ['Average Score', `${selected.avg}%`],
            ['Status', selected.status],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setModal(null)}>Close</Button>
            <Button variant="primary">📄 View Results</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
