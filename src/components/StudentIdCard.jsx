import { Printer } from 'lucide-react';

const SCHOOL_NAME = import.meta.env.VITE_APP_NAME || 'MBS';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function display(value) {
  return value === undefined || value === null || value === '' ? '—' : value;
}

/**
 * Student identity card.
 *
 * Renders a credit-card style ID on screen and prints a clean copy on demand.
 * The card is built entirely from inline styles so the print step can clone it
 * into a bare window without shipping the app's stylesheet. The "MBS OFFICIAL"
 * watermark and the caption beneath the card are screen-only: the print step
 * strips anything marked `id-card-watermark` before it reaches the printer.
 */
export default function StudentIdCard({ student }) {
  if (!student) return null;

  const name = student.name || student.fullname || '';
  const className = student.class?.name || student.class || '';
  const serial = student.serial || student.serialNumber || '';
  const reg = student.reg || student.registrationNumber || '';
  const photo = student.profileImage || student.photo || '';

  const rows = [
    ['Registration No.', display(reg)],
    ['Serial No.', display(serial)],
    ['Class', display(className)],
    ['Gender', display(student.gender)],
    ['NIN', display(student.nin)],
    ['LASRA ID', display(student.lasraId)],
  ];

  const handlePrint = () => {
    const card = document.getElementById('sms-id-card');
    if (!card) return;

    // Clone the card and drop the watermark so it never reaches paper.
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('.id-card-watermark').forEach((el) => el.remove());

    const win = window.open('', '_blank', 'width=780,height=560');
    win.document.write(`
      <!doctype html><html><head>
        <title>${name || 'Student'} — Identity Card</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 24px; background: #fff; }
          @page { margin: 10mm; }
        </style>
      </head><body>
        ${clone.outerHTML}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div>
      <div
        id="sms-id-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #0E6B2F 0%, #16833B 52%, #0A4520 100%)',
          color: '#ffffff',
          padding: '18px 20px',
          boxShadow: '0 18px 40px -20px rgba(10,69,32,0.65)',
        }}
      >
        {/* Watermark — on screen only; stripped before printing. */}
        <div
          className="id-card-watermark"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              transform: 'rotate(-24deg)',
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: 6,
              color: 'rgba(255,255,255,0.10)',
              whiteSpace: 'nowrap',
            }}
          >
            MBS OFFICIAL
          </span>
        </div>

        <div
          style={{
            height: 4,
            width: 64,
            borderRadius: 999,
            background: '#F2C14E',
            marginBottom: 14,
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
              {SCHOOL_NAME}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: '#F2C14E',
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              STUDENT IDENTITY CARD
            </div>
          </div>

          <div
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            2025 / 2026
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 16, marginTop: 16 }}>
          <div
            style={{
              width: 84,
              height: 96,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 30, fontWeight: 900, color: '#F2C14E' }}>
                {initials(name)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>
              {display(name)}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 14px',
                marginTop: 10,
              }}
            >
              {rows.map(([label, value]) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: 8.5,
                      letterSpacing: 1.2,
                      color: 'rgba(255,255,255,0.55)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            marginTop: 14,
            paddingTop: 10,
            borderTop: '1px dashed rgba(255,255,255,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 9,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <span>
            Property of {SCHOOL_NAME}. If found, please return to the school office.
          </span>
          <span style={{ fontFamily: 'monospace' }}>{display(reg)}</span>
        </div>
      </div>

      {/* On-screen only: kept out of the print clone entirely. */}
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: 4,
            fontWeight: 800,
            color: '#94A3B8',
          }}
        >
          MBS OFFICIAL
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <button
          onClick={handlePrint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            background: '#16833B',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <Printer size={15} /> Print ID card
        </button>
      </div>
    </div>
  );
}
