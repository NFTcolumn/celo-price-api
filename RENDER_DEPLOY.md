# Deploying to Render

This guide walks you through deploying the Crypto Price Aggregator API to Render.

## Prerequisites

- A [Render account](https://render.com) (free tier available)
- This repository pushed to GitHub, GitLab, or Bitbucket

## Deployment Methods

### Method 1: Using render.yaml (Recommended)

This repository includes a `render.yaml` file that automates the entire deployment process.

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" and select "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to create the service

3. **Your API will be live** at:
   ```
   https://crypto-price-aggregator.onrender.com
   ```

### Method 2: Manual Setup

If you prefer to configure manually:

1. **Create a new Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" and select "Web Service"
   - Connect your repository

2. **Configure the service**:
   - **Name**: `crypto-price-aggregator`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Add environment variables**:
   - `PORT`: `10000` (automatically set by Render)
   - `CELO_RPC_URL`: `https://forno.celo.org`
   - `CACHE_TTL`: `30`
   - `DEFAULT_SWAP_AMOUNT`: `1`
   - `NODE_ENV`: `production`

4. **Deploy**: Click "Create Web Service"

## Post-Deployment

### Test Your API

Once deployed, test your API endpoints:

```bash
# Replace YOUR-APP with your actual Render URL
export API_URL="https://crypto-price-aggregator.onrender.com"

# Health check
curl $API_URL/health

# Get CELO price
curl $API_URL/price/0x471EcE3750Da237f93B8E339c536989b8978a438

# Get token value
curl $API_URL/value/0x471EcE3750Da237f93B8E339c536989b8978a438/100

# Get available tokens
curl $API_URL/tokens
```

### Configure Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domain"
3. Add your domain and follow DNS configuration instructions

## Important Notes

### Free Tier Limitations

- **Spin down after inactivity**: Free services sleep after 15 minutes of inactivity
- **First request**: May take 30-50 seconds to wake up
- **Memory**: 512 MB RAM
- **Bandwidth**: 100 GB/month

### RPC Endpoints

The default RPC endpoint (`https://forno.celo.org`) is public and free but may have rate limits. For production use, consider:

- [Ankr](https://rpc.ankr.com/celo) - Free tier available
- [QuickNode](https://www.quicknode.com/) - Paid plans with higher limits
- [Infura](https://infura.io/) - Supports Celo

Update the `CELO_RPC_URL` environment variable in Render settings.

### Monitoring

- View logs: Dashboard → Your Service → Logs
- Health endpoint: `https://your-app.onrender.com/health`
- Auto-deploys: Enabled by default on git push

## Troubleshooting

### Service Won't Start

Check the logs for errors:
1. Go to Render Dashboard
2. Click on your service
3. View the "Logs" tab

Common issues:
- Missing environment variables
- Port conflicts (Render automatically sets PORT)
- Build failures (check `package.json` dependencies)

### RPC Connection Issues

If you see "Failed to fetch" errors:
- Verify `CELO_RPC_URL` is set correctly
- Try alternative RPC endpoints
- Check RPC endpoint status/rate limits

### Slow Response Times

First request after sleep:
- Free tier services sleep after 15 minutes
- Upgrade to paid plan for 24/7 availability

Caching:
- Adjust `CACHE_TTL` for your use case (default: 30 seconds)
- Higher values = faster responses but less fresh data

## Upgrading

To upgrade from free tier:

1. Go to your service settings
2. Select a paid plan (starting at $7/month)
3. Benefits:
   - No spin down
   - More memory/CPU
   - Higher bandwidth
   - Faster response times

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `10000` | Server port (auto-set by Render) |
| `CELO_RPC_URL` | `https://forno.celo.org` | Celo RPC endpoint |
| `CACHE_TTL` | `30` | Cache duration in seconds |
| `DEFAULT_SWAP_AMOUNT` | `1` | Default token amount for price checks |
| `NODE_ENV` | `production` | Environment mode |

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- Check service logs for debugging

## Next Steps

- Add your API URL to your frontend apps
- Set up monitoring/alerting
- Consider upgrading for production use
- Add custom domain for professional branding
