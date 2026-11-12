import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaFlask, FaSignInAlt, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

/**
 * Sticky top banner shown to demo users reminding them they are in demo mode.
 */
const DemoBanner = () => {
  // Banner hidden by design — demo users explore without interruption
  return null;
};

export default DemoBanner;
