FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* duoc nhung vao bundle luc build, nen phai khai bao truoc `npm run build`.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_PAYMENT_MODE=api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PAYMENT_MODE=$NEXT_PUBLIC_PAYMENT_MODE
RUN npm run build
# NODE_ENV=production dat sau npm ci va npm run build: de devDependencies van duoc cai va co mat luc build.
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start"]
