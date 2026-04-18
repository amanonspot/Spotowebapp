#!/bin/bash

# Spoto Next.js Application Deployment Script
# Run this script on your server to set up nginx and PM2

set -e

echo "🚀 Starting Spoto deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/spoto"
NGINX_SITE="spoto"
DOMAIN="your-domain.com"  # Replace with your actual domain

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Install nginx (if not already installed)
if ! command -v nginx &> /dev/null; then
    print_status "Installing nginx..."
    sudo apt install -y nginx
fi

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Copy nginx configuration
print_status "Setting up nginx configuration..."
sudo cp nginx.conf /etc/nginx/sites-available/$NGINX_SITE
sudo ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo nginx -t

# Create log directories
print_status "Creating log directories..."
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Create PM2 startup script
print_status "Setting up PM2 startup..."
pm2 startup
print_warning "Run the command shown above as root to enable PM2 startup"

# Instructions for manual steps
print_status "Deployment script completed!"
echo ""
echo "📋 Manual steps required:"
echo "1. Copy your Next.js project files to $PROJECT_DIR"
echo "2. Run 'npm install' in the project directory"
echo "3. Run 'npm run build' to build the project"
echo "4. Start the application with 'pm2 start ecosystem.config.js'"
echo "5. Restart nginx with 'sudo systemctl restart nginx'"
echo "6. Configure SSL certificate (recommended)"
echo ""
echo "🔧 Useful commands:"
echo "  PM2 status: pm2 status"
echo "  PM2 logs: pm2 logs spoto-nextjs"
echo "  PM2 restart: pm2 restart spoto-nextjs"
echo "  Nginx status: sudo systemctl status nginx"
echo "  Nginx restart: sudo systemctl restart nginx"
echo ""
echo "🌐 Your application will be available at: http://$DOMAIN"
echo ""

# Optional: Set up SSL with Let's Encrypt
read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setting up SSL with Let's Encrypt..."
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    print_status "SSL certificate installed!"
    print_warning "Make sure to update the nginx configuration to redirect HTTP to HTTPS"
fi

print_status "Deployment completed! 🎉"
