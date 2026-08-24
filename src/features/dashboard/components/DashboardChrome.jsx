import cellularIcon from "../../../assets/icons/dashboard-cellular.svg";
import wifiIcon from "../../../assets/icons/dashboard-wifi.svg";
import batteryIcon from "../../../assets/icons/dashboard-battery.svg";

export function SystemStatusBar() {
  return (
    <div className="dashboard-status" aria-label="시스템 상태">
      <span>9:41</span><span>Mon Jun 6</span>
      <div><img src={cellularIcon} alt="" /><img src={wifiIcon} alt="" /><span>65%</span><img src={batteryIcon} alt="" /></div>
    </div>
  );
}
