
function App() {
  return (
  <div>
    <h2>Hello from React!</h2>
    <div>
      This app is using Chrome (
      {window.versions.chrome()}), Node.js (
      {window.versions.node()}), and Electron ({window.versions.electron()})
    </div>
  </div>    
  );
}

export default App;
