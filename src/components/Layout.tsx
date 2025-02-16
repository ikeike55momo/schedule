import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export default function Layout() {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Team Schedule</Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent">
        <List>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="カレンダー" />
            </ListItemButton>
          </ListItem>
          {/* 他のメニュー項目を追加 */}
        </List>
      </Drawer>
      <Outlet />
    </div>
  );
}
