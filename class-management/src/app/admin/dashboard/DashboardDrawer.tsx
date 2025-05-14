// import Drawer from '@mui/material/Drawer';
// import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem';
// import ListItemButton from '@mui/material/ListItemButton';
// import ListItemIcon from '@mui/material/ListItemIcon';
// import ListItemText from '@mui/material/ListItemText';
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import Toolbar from '@mui/material/Toolbar';
// import NotificationsIcon from '@mui/icons-material/Notifications';
// import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

// const menu = [
//   { text: '仪表盘', icon: <DashboardIcon /> },
//   { text: '通知管理', icon: <NotificationsIcon /> },
//   { text: '请假审批', icon: <AssignmentIndIcon /> },
// ];

// export default function DashboardDrawer({ drawerWidth }: { drawerWidth: number }) {
//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         width: drawerWidth,
//         flexShrink: 0,
//         [`& .MuiDrawer-paper`]: {
//           width: drawerWidth,
//           boxSizing: 'border-box',
//           bgcolor: '#1565c0',
//           color: '#fff',
//         },
//       }}
//     >
//       <Toolbar />
//       <List>
//         {menu.map((item, idx) => (
//           <ListItem key={item.text} disablePadding>
//             <ListItemButton selected={idx === 0}>
//               <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
//               <ListItemText primary={item.text} />
//             </ListItemButton>
//           </ListItem>
//         ))}
//       </List>
//     </Drawer>
//   );
// }