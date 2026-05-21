import { RouteVideoLoading } from "@/components/shared/RouteVideoLoading";

export default function DiscussionsLoading() {
  return (
    <RouteVideoLoading
      activeNav="community"
      label="Loading community"
      useVideo={false}
      videoActive={false}
    />
  );
}
