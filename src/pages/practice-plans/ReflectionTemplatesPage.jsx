import PageShell from '../../components/pages/PageShell'
import ReflectionTemplateEditor from '../../components/practice/ReflectionTemplateEditor'

export default function ReflectionTemplatesPage({ showToast }) {
  return (
    <PageShell
      breadcrumb="Practice > Reflection Templates"
      title="Reflection Templates"
      subtitle="Manage pre- and post-practice reflection questions for players"
    >
      <ReflectionTemplateEditor showToast={showToast} />
    </PageShell>
  )
}
