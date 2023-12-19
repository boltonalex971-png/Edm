import '@progress/kendo-theme-bootstrap/dist/all.css';
import { HostTabs } from './components/HostTabs';
import './custom.css';
import { usePluginData } from '@microprojects/react-utils';

function App() {
  usePluginData()

  return (
    <div className="App">
      <HostTabs />
    </div>
  );
}

export default App;
