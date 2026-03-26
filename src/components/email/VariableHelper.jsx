import { useTheme } from '../../contexts/ThemeContext'

const TEMPLATE_VARIABLES = {
  registration_confirmation: [
    { key: 'player_name', desc: "Player's first + last initial" },
    { key: 'parent_name', desc: "Parent/guardian name" },
    { key: 'season_name', desc: 'Season name' },
    { key: 'team_name', desc: 'Assigned team' },
    { key: 'start_date', desc: 'Season start date' },
    { key: 'org_name', desc: 'Organization name' },
    { key: 'app_url', desc: 'App URL' },
  ],
  payment_receipt: [
    { key: 'payer_name', desc: 'Person who paid' },
    { key: 'parent_name', desc: "Parent/guardian name" },
    { key: 'amount', desc: 'Payment amount' },
    { key: 'description', desc: 'What the payment was for' },
    { key: 'payment_date', desc: 'Date of payment' },
    { key: 'payment_method', desc: 'Card, Venmo, etc.' },
    { key: 'transaction_id', desc: 'Reference number' },
    { key: 'org_name', desc: 'Organization name' },
    { key: 'app_url', desc: 'App URL' },
  ],
  blast_announcement: [
    { key: 'subject', desc: 'Email subject line' },
    { key: 'heading', desc: 'Header heading text' },
    { key: 'body', desc: 'Email body (rich text)' },
    { key: 'coach_name', desc: 'Sending coach name' },
    { key: 'org_name', desc: 'Organization name' },
    { key: 'app_url', desc: 'App URL' },
  ],
}

export default function VariableHelper({ templateType, onInsert }) {
  const { isDark } = useTheme()
  const vars = TEMPLATE_VARIABLES[templateType] || []

  if (vars.length === 0) return null

  return (
    <div className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-[#F5F6F8] border border-[#E8ECF2]'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Available Variables
      </p>
      <div className="flex flex-wrap gap-1.5">
        {vars.map(v => (
          <button
            key={v.key}
            onClick={() => onInsert?.(`{{${v.key}}}`)}
            title={v.desc}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
              isDark
                ? 'bg-[#4BB9EC]/10 text-[#4BB9EC] hover:bg-[#4BB9EC]/20'
                : 'bg-[#4BB9EC]/10 text-[#0d7bb5] hover:bg-[#4BB9EC]/20'
            }`}
            type="button"
          >
            {`{{${v.key}}}`}
          </button>
        ))}
      </div>
    </div>
  )
}

export { TEMPLATE_VARIABLES }
