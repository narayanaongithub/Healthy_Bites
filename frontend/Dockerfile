FROM nginx:alpine

# Copy static files
COPY static /usr/share/nginx/html/static
COPY templates /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
