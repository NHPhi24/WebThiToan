import React from 'react';
import 'katex/dist/katex.min.css';
import './App.css';

// Router
import AppRouter from './router.jsx';

function App() {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const [user, setUser] = React.useState(storedUser);
  const [isLoggedIn, setIsLoggedIn] = React.useState(!!storedUser);

  return (
    <AppRouter
      user={user}
      setIsLoggedIn={setIsLoggedIn}
      setUser={setUser}
      isLoggedIn={isLoggedIn}
    />
  );
}

export default App;
