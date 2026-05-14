 export default function TaskSkeleton({ count = 3 }) {
     return (
       <div className="skeleton-list">
         {Array.from({ length: count }).map((_, i) => (
           <div key={i} className="skeleton-card">
             <div className="skeleton-line" style={{ width: '60%' }} />
             <div className="skeleton-line" style={{ width: '30%' }} />
           </div>
         ))}
       </div>
     );
   }