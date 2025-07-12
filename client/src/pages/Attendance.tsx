// // Example: Dashboard.tsx or Navbar.tsx
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/hooks/useAuth";
// import { Link } from "wouter";

// type User = {
//   role?: string;
//   // add other user properties if needed
// };

// export default function Dashboard() {
//   const { user } = useAuth() as { user: User };

//   return (
//     <div>
//       {/* ...other navigation buttons... */}
//       {user?.role === "attendance_manager" && (
//         <Link href="https://attandace.netlify.app/">
//           <Button>
//             Attendance
//           </Button>
//         </Link>
//       )}
//       {/* ...other navigation buttons... */}
//     </div>
//   );
// }

// export function Attendance() {
//   return (
//     <div>
//       {/* Attendance page content goes here */}
//       <h1>Attendance System</h1>
//       {/* Add your attendance UI/components here */}
//     </div>
//   );
// }