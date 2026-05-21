import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";

export default function FeaturedLoading() {
  return (
    <RouteVideoLoading
      activeNav="featured"
      label="Loading featured"
      useVideo={false}
      videoActive={false}
    />
  );
}
