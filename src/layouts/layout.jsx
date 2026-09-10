import AiAssistant from './../components/AIAssistant'

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen">
      {/* Your existing sidebar */}
      
      <main>
        {children}
      </main>

      {/* Global AI Assistant */}
      <AiAssistant />
    </div>
  );
};

export default DashboardLayout;
