import '../styles/App.module.css';
import { ReactP5Wrapper } from "react-p5-wrapper";
import sketch from "./sketch"
 
function App() {
  return (
    <div> 
      <ReactP5Wrapper sketch={sketch}/>
    </div>
  );
}

export default App;
