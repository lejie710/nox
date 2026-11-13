// Every public source the site cites. One spec version only: ACPI 6.6.
// Section numbers are printed only once confirmed against the 6.6 text;
// until then a source names its section by title (a test enforces this).
// The order of this list is the citation numbering on the page.

export interface Source {
  id: string;
  title: string;
  where: string;
  url: string;
}

export const SOURCE_LIST: Source[] = [
  {
    id: "acpiEc",
    title: "ACPI Specification 6.6",
    where: "Chapter 12, ACPI Embedded Controller Interface Specification",
    url: "https://uefi.org/specs/ACPI/6.6/12_Embedded_Controller_Interface_Specification.html",
  },
  {
    id: "acpiLid",
    title: "ACPI Specification 6.6",
    where: "Chapter 9, Control Method Lid Device (Table 9.3)",
    url: "https://uefi.org/specs/ACPI/6.6/09_ACPI_Defined_Devices_and_Device_Specific_Objects.html",
  },
  {
    id: "msModernStandby",
    title: "Microsoft Learn",
    where: "Modern Standby",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby",
  },
  {
    id: "msSystemPowerStates",
    title: "Microsoft Learn",
    where: "System power states",
    url: "https://learn.microsoft.com/en-us/windows/win32/power/system-power-states",
  },
  {
    id: "acpiSleep",
    title: "ACPI Specification 6.6",
    where: "Chapter 16, Waking and Sleeping",
    url: "https://uefi.org/specs/ACPI/6.6/16_Waking_and_Sleeping.html",
  },
  {
    id: "linuxCpuidle",
    title: "Linux kernel documentation",
    where: "CPU Idle Time Management",
    url: "https://docs.kernel.org/admin-guide/pm/cpuidle.html",
  },
  {
    id: "msWifiPm",
    title: "Microsoft Learn",
    where: "Wi-Fi power management for modern standby platforms",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/wi-fi-power-management-for-modern-standby-platforms",
  },
  {
    id: "msPrepareHardware",
    title: "Microsoft Learn",
    where: "Prepare hardware for modern standby",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/prepare-hardware-for-modern-standby",
  },
  {
    id: "msDeviceLowPower",
    title: "Microsoft Learn",
    where: "Device low-power states",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/device-sleeping-states",
  },
  {
    id: "msWakeSources",
    title: "Microsoft Learn",
    where: "Modern Standby wake sources",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-wake-sources",
  },
  {
    id: "acpiTerms",
    title: "ACPI Specification 6.6",
    where: "Chapter 2, Definition of Terms: global, sleeping and soft-off states",
    url: "https://uefi.org/specs/ACPI/6.6/02_Definition_of_Terms.html",
  },
  {
    id: "msStandbyStates",
    title: "Microsoft Learn",
    where: "Modern Standby states",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-states",
  },
  {
    id: "msDevicePowerStates",
    title: "Microsoft Learn",
    where: "Device power states",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/device-power-states",
  },
  {
    id: "acpiProcessor",
    title: "ACPI Specification 6.6",
    where: "Chapter 8, Processor Configuration and Control: processor power states C0 to C3",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiTables",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: system description tables",
    url: "https://uefi.org/specs/ACPI/6.6/05_ACPI_Software_Programming_Model.html",
  },
  {
    id: "acpiHardware",
    title: "ACPI Specification 6.6",
    where: "Chapter 4, ACPI Hardware Specification: the real-time clock in mechanical off",
    url: "https://uefi.org/specs/ACPI/6.6/04_ACPI_Hardware_Specification.html",
  },
  {
    id: "msD3cold",
    title: "Microsoft Learn",
    where: "Firmware requirements for D3cold",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/bringup/firmware-requirements-for-d3cold",
  },
  {
    id: "linuxSleepStates",
    title: "Linux kernel documentation",
    where: "System Sleep States",
    url: "https://docs.kernel.org/admin-guide/pm/sleep-states.html",
  },
  {
    id: "msPowercfg",
    title: "Microsoft Learn",
    where: "Powercfg command-line options",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options",
  },
  {
    id: "msIdleActive",
    title: "Microsoft Learn",
    where: "Transitioning between idle and active states",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/transitioning-between-idle-and-active-states",
  },
  {
    id: "msNetworkConnectivity",
    title: "Microsoft Learn",
    where: "Modern Standby network connectivity",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-network-connectivity",
  },
  {
    id: "msStandbyVsS3",
    title: "Microsoft Learn",
    where: "Modern Standby vs S3",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-vs-s3",
  },
  {
    id: "msSleepStudy",
    title: "Microsoft Learn",
    where: "Modern standby SleepStudy",
    url: "https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-sleepstudy",
  },
  // Chapter 3, device power: read in full from the pages and the ACPI 6.6 PDF. The ACPI
  // chapter pages answered "Page not found" on 2026-11-09, so these cite the 6.6 PDF itself.
  {
    id: "acpiDevicePower",
    title: "ACPI Specification 6.6",
    where: "Chapter 2, Definition of Terms: device power state definitions (Table 2.2)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiSetDevicePower",
    title: "ACPI Specification 6.6",
    where: "Chapter 3, ACPI Concepts: device power management, setting device power states",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiPowerResources",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 7, Power and Performance Management: power resources and device power management objects, _PR0 to _PR3, _PRW, _DSW and _S0W (Table 7.1)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiNotify",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: device object notifications (Table 5.226)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "msD3coldDriver",
    title: "Microsoft Learn",
    where: "Supporting D3cold in a driver",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/supporting-d3cold-in-a-driver",
  },
  {
    id: "linuxDevicePm",
    title: "Linux kernel documentation",
    where: "Device Power Management Basics",
    url: "https://docs.kernel.org/driver-api/pm/devices.html",
  },
  {
    id: "linuxRuntimePm",
    title: "Linux kernel documentation",
    where: "Runtime Power Management Framework for I/O Devices",
    url: "https://docs.kernel.org/power/runtime_pm.html",
  },
  // Chapter 4, CPU power. The uefi.org HTML chapter pages answered "Page not
  // found", so the ACPI ones cite the PDF.
  {
    id: "acpiProcessorDefs",
    title: "ACPI Specification 6.6",
    where: "Chapter 2, Definition of Terms: processor power state and performance state definitions",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiProcessorConcepts",
    title: "ACPI Specification 6.6",
    where: "Chapter 3, ACPI Concepts: processor power management",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiLpi",
    title: "ACPI Specification 6.6",
    where: "Chapter 8, Processor Configuration and Control: _CST and lower power idle states (_LPI, Table 8.5)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiContainers",
    title: "ACPI Specification 6.6",
    where: "Chapter 8, Processor Configuration and Control: processor hierarchy and processor container devices",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiPerf",
    title: "ACPI Specification 6.6",
    where: "Chapter 8, Processor Configuration and Control: processor performance control (_PSS, _PPC)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiCppc",
    title: "ACPI Specification 6.6",
    where: "Chapter 8, Processor Configuration and Control: collaborative processor performance control (_CPC)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "linuxCpufreq",
    title: "Linux kernel documentation",
    where: "CPU Performance Scaling",
    url: "https://docs.kernel.org/admin-guide/pm/cpufreq.html",
  },
  {
    id: "linuxCppc",
    title: "Linux kernel documentation",
    where: "Collaborative Processor Performance Control (CPPC)",
    url: "https://docs.kernel.org/admin-guide/acpi/cppc_sysfs.html",
  },
  {
    id: "msPpm",
    title: "Microsoft Learn",
    where: "Processor power management options",
    url: "https://learn.microsoft.com/en-us/windows-hardware/customize/power-settings/configure-processor-power-management-options",
  },
  {
    id: "msIdlePromote",
    title: "Microsoft Learn",
    where: "IdlePromoteThreshold",
    url: "https://learn.microsoft.com/en-us/windows-hardware/customize/power-settings/options-for-perf-state-engine-idlepromotethreshold",
  },
  {
    id: "msIdleDemote",
    title: "Microsoft Learn",
    where: "IdleDemoteThreshold",
    url: "https://learn.microsoft.com/en-us/windows-hardware/customize/power-settings/options-for-perf-state-engine-idledemotethreshold",
  },
  {
    id: "msPerfBoost",
    title: "Microsoft Learn",
    where: "PERFBOOSTMODE",
    url: "https://learn.microsoft.com/en-us/windows-hardware/customize/power-settings/options-for-perf-state-engine-perfboostmode",
  },
  // Chapter 5, sleep and wake: read in full from the ACPI 6.6 PDF text and the pages.
  // The ACPI ones cite the PDF.
  {
    id: "acpiSleepMethods",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 7, Power and Performance Management: system-level control methods (_PTS, _Sx, _SWS, _TTS, _WAK) and how the OS uses them",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiSleeping",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 16, Waking and Sleeping: sleeping states, the transition from working to sleeping, and initialization on wake",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiFacs",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: Firmware ACPI Control Structure (FACS), the waking vectors",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiFixedHardware",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 4, ACPI Hardware Specification: fixed hardware features (power button, sleeping and wake control, real-time clock alarm), fixed hardware registers, general-purpose event registers and the example generic devices (lid switch)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiWaking",
    title: "ACPI Specification 6.6",
    where: "Chapter 3, ACPI Concepts: waking the system, and system events",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiEvents",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 5, ACPI Software Programming Model: the ACPI event programming model, general-purpose event handling",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiButtons",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 9, ACPI-Defined Devices and Device-Specific Objects: control method lid device, control method power and sleep button devices",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiEcQuery",
    title: "ACPI Specification 6.6",
    where: "Chapter 12, ACPI Embedded Controller Interface Specification: the query command",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiFlexible",
    title: "ACPI Specification 6.6",
    where: "Chapter 3, ACPI Concepts: flexible platform architecture support (hardware-reduced ACPI, low-power idle)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "linuxSuspendFlows",
    title: "Linux kernel documentation",
    where: "System Suspend Code Flows",
    url: "https://docs.kernel.org/admin-guide/pm/suspend-flows.html",
  },
  {
    id: "linuxPmDebug",
    title: "Linux kernel documentation",
    where: "Debugging hibernation and suspend",
    url: "https://docs.kernel.org/power/basic-pm-debugging.html",
  },
  {
    id: "msWakeEvents",
    title: "Microsoft Learn",
    where: "System Wake-up Events",
    url: "https://learn.microsoft.com/en-us/windows/win32/power/system-wake-up-events",
  },
  // Chapter 6, under the hood.
  {
    id: "acpiRsdp",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 5, ACPI Software Programming Model: overview of the system description table architecture, Root System Description Pointer (RSDP)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiTableHeader",
    title: "ACPI Specification 6.6",
    where:
      "Chapter 5, ACPI Software Programming Model: System Description Table Header, Root System Description Table (RSDT), Extended System Description Table (XSDT)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiFadt",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: Fixed ACPI Description Table (FADT)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiDefBlocks",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: Definition Blocks (DSDT, SSDT)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiNamespace",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: ACPI Namespace, Definition Block Encoding",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiMethodsAsl",
    title: "ACPI Specification 6.6",
    where: "Chapter 5, ACPI Software Programming Model: Control Methods and the ACPI Source Language (ASL)",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiAml",
    title: "ACPI Specification 6.6",
    where: "Chapter 20, ACPI Machine Language (AML) Specification: AML grammar definition",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "acpiAslNames",
    title: "ACPI Specification 6.6",
    where: "Chapter 19, ACPI Source Language (ASL) Reference: ASL names",
    url: "https://uefi.org/sites/default/files/resources/ACPI_Spec_6.6.pdf",
  },
  {
    id: "linuxAcpiEnumeration",
    title: "Linux kernel documentation",
    where: "ACPI Based Device Enumeration",
    url: "https://docs.kernel.org/firmware-guide/acpi/enumeration.html",
  },
  {
    id: "linuxAcpiTableUpgrade",
    title: "Linux kernel documentation",
    where: "Upgrading ACPI tables via initrd",
    url: "https://docs.kernel.org/admin-guide/acpi/initrd_table_override.html",
  },
  {
    id: "linuxAcpiNamespace",
    title: "Linux kernel documentation",
    where: "ACPI Device Tree: Representation of ACPI Namespace",
    url: "https://docs.kernel.org/firmware-guide/acpi/namespace.html",
  },
  {
    id: "msAslCompiler",
    title: "Microsoft Learn",
    where: "Microsoft ASL Compiler",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/bringup/microsoft-asl-compiler",
  },
  {
    id: "msDeviceNamespaceObjects",
    title: "Microsoft Learn",
    where: "Device Management Namespace Objects",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/bringup/device-management-namespace-objects",
  },
];

export const SOURCES: Record<string, Source> = Object.fromEntries(SOURCE_LIST.map((s) => [s.id, s]));

export function source(id: string): Source {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source ${id}`);
  return s;
}

/** The citation number shown on the page, 1-based, in list order. */
export function sourceNumber(id: string): number {
  const i = SOURCE_LIST.findIndex((s) => s.id === id);
  if (i < 0) throw new Error(`Unknown source ${id}`);
  return i + 1;
}
