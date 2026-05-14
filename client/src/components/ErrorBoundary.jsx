import { Component } from 'react';
   export default class ErrorBoundary extends Component {
     state = { hasError: false };
     static getDerivedStateFromError() {
       return { hasError: true };
     }
     render() {
       if (this.state.hasError) {
         return (
           <div className="error-boundary">
             <h2>Terjadi kesalahan</h2>
             <p>Coba muat ulang halaman ini.</p>
             <button onClick={() => window.location.reload()}>Muat ulang</button>
           </div>
         );
       }
       return this.props.children;
     }
   }