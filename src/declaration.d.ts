// Required to allow importing images with webpack in typescript
declare module "*.png";
declare module "*.jpg";
declare module "*.svg";
declare module "*.module.scss" {
  const content: Record<string, string>;
  export default content;
}
declare module "*.scss";
