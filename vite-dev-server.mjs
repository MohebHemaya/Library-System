#!/usr/bin/env node

/**
 * Simple Development Server
 * Combines Vite + API Handler
 * 
 * Run with: node vite-dev-server.mjs
 */

import { createServer as createViteServer } from 'vite';
import http from 'http';
import url from 'url';

let database = {
  books: [
    {
      "id": "8197",
      "title": "Writings to Young Women from Laura Ingalls Wilder: On Wisdom and Virtues (Writings to Young Women on Laura Ingalls Wilder #1)",
      "authors": "Laura Ingalls Wilder/Stephen W. Hines",
      "average_rating": "3.99",
      "isbn": "1400307848",
      "isbn13": "9781400307845",
      "language_code": "eng",
      "num_pages": "225",
      "ratings_count": "108",
      "text_reviews_count": "11",
      "publication_date": "5/10/2006",
      "publisher": "Tommy Nelson",
      "lent": false,
      "totalCopies": 5,
      "availableCopies": 5,
      "debtCost": 50,
      "category": "Self-Help"
    },
    {
      "id": "890",
      "title": "Of Mice and Men",
      "authors": "John Steinbeck",
      "average_rating": "3.87",
      "isbn": "0142000671",
      "isbn13": "9780142000670",
      "language_code": "eng",
      "num_pages": "103",
      "ratings_count": "1755253",
      "text_reviews_count": "25554",
      "publication_date": "1/8/2002",
      "publisher": "Penguin Books",
      "lent": true,
      "totalCopies": 12,
      "availableCopies": 8,
      "debtCost": 40,
      "category": "Fiction"
    }
  ],
  members: [
    { "id": "454d", "name": "Moheb", "debt": 0 },
    { "id": "ba9a", "name": "abdo", "debt": 0 },
    { "id": "7f5f", "name": "seif", "debt": 0 }
  ],
  transactions: []
};

async function createServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true }
  });

  const httpServer = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle API requests
    if (req.url.startsWith('/api/db')) {
      const parsedUrl = new url.URL(req.url, `http://${req.headers.host}`);
      const resource = parsedUrl.searchParams.get('resource');
      const id = parsedUrl.searchParams.get('id');

      res.setHeader('Content-Type', 'application/json');

      if (!resource || !['books', 'members', 'transactions'].includes(resource)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid resource' }));
        return;
      }

      try {
        switch (req.method) {
          case 'GET': {
            if (id) {
              const item = database[resource].find(item => item.id === id);
              res.writeHead(item ? 200 : 404);
              res.end(JSON.stringify(item || { error: 'Not found' }));
            } else {
              res.writeHead(200);
              res.end(JSON.stringify(database[resource]));
            }
            break;
          }

          case 'POST': {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              const newItem = { ...JSON.parse(body), id: Date.now().toString() };
              database[resource].push(newItem);
              res.writeHead(201);
              res.end(JSON.stringify(newItem));
            });
            break;
          }

          case 'PUT':
          case 'PATCH': {
            if (!id) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'ID required' }));
              return;
            }
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              const index = database[resource].findIndex(item => item.id === id);
              if (index === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
              } else {
                database[resource][index] = { ...database[resource][index], ...JSON.parse(body) };
                res.writeHead(200);
                res.end(JSON.stringify(database[resource][index]));
              }
            });
            break;
          }

          case 'DELETE': {
            if (!id) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'ID required' }));
              return;
            }
            database[resource] = database[resource].filter(item => item.id !== id);
            res.writeHead(204);
            res.end();
            break;
          }

          default:
            res.writeHead(405);
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      } catch (e) {
        console.error('API Error:', e);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
      return;
    }

    // Use Vite for everything else
    return vite.middlewares(req, res);
  });

  httpServer.listen(5173, () => {
    console.log('🚀 Dev server running on http://localhost:5173');
  });
}

createServer().catch(console.error);
