import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
    handleMenuClose();
    setMobileOpen(false);
  };

  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
        <ListItemIcon>
          <DashboardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </MenuItem>
    </Menu>
  );

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" component="div" sx={{ my: 2, ml: 2 }}>
            Viral Clips
          </Typography>
        </ListItem>
        <Divider />

        {currentUser ? (
          <>
            <ListItem button component={RouterLink} to="/dashboard">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={RouterLink} to="/gallery">
              <ListItemIcon>
                <VideoLibraryIcon />
              </ListItemIcon>
              <ListItemText primary="Gallery" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={RouterLink} to="/login">
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button component={RouterLink} to="/signup">
              <ListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          Viral Clips
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex' }}>
            {currentUser ? (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/dashboard"
                  sx={{ mx: 1 }}
                >
                  Dashboard
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/gallery"
                  sx={{ mx: 1 }}
                >
                  Gallery
                </Button>
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  {currentUser.photoURL ? (
                    <Avatar
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || currentUser.email}
                      sx={{ width: 32, height: 32 }}
                    />
                  ) : (
                    <AccountCircleIcon />
                  )}
                </IconButton>
              </>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  Login
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/signup"
                  variant="outlined"
                  sx={{ ml: 1, borderColor: 'white', '&:hover': { borderColor: 'white' } }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>

      {renderMenu}
    </AppBar>
  );
} 