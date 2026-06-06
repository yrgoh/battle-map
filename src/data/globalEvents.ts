export interface GlobalEvent {
  date: string;
  title: string;
  theatre?: string;
  lat?: number;
  lng?: number;
}

/** Static WWII global events for the Reference Timeline. */
export const GLOBAL_EVENTS: GlobalEvent[] = [
  { date: '1939-09-01', title: 'Germany invades Poland', theatre: 'eastern_front' },
  { date: '1939-09-03', title: 'Britain & France declare war' },
  { date: '1939-09-17', title: 'USSR invades Poland', theatre: 'eastern_front' },
  { date: '1940-05-10', title: 'Battle of France begins' },
  { date: '1940-06-22', title: 'France surrenders' },
  { date: '1940-07-10', title: 'Battle of Britain begins' },
  { date: '1941-06-22', title: 'Operation Barbarossa', theatre: 'eastern_front' },
  { date: '1941-09-08', title: 'Siege of Leningrad begins', theatre: 'eastern_front' },
  { date: '1941-10-02', title: 'Battle of Moscow begins', theatre: 'eastern_front' },
  { date: '1941-12-07', title: 'Pearl Harbor', theatre: 'pacific' },
  { date: '1941-12-08', title: 'USA enters war' },
  { date: '1942-06-04', title: 'Battle of Midway', theatre: 'pacific', lat: 28.2, lng: -177.4 },
  { date: '1942-06-28', title: 'Case Blue begins', theatre: 'eastern_front' },
  { date: '1942-07-01', title: 'First Battle of El Alamein', theatre: 'north_africa' },
  { date: '1942-08-07', title: 'Guadalcanal campaign', theatre: 'pacific' },
  { date: '1942-10-23', title: 'Second Battle of El Alamein', theatre: 'north_africa' },
  { date: '1942-11-08', title: 'Operation Torch', theatre: 'north_africa' },
  { date: '1942-11-19', title: 'Operation Uranus', theatre: 'eastern_front' },
  { date: '1943-02-02', title: 'Stalingrad surrenders', theatre: 'eastern_front' },
  { date: '1943-07-05', title: 'Battle of Kursk begins', theatre: 'eastern_front' },
  { date: '1943-07-10', title: 'Allied invasion of Sicily', theatre: 'mediterranean' },
  { date: '1943-09-03', title: 'Italy surrenders', theatre: 'mediterranean' },
  { date: '1944-06-06', title: 'D-Day (Normandy)', theatre: 'western_front' },
  { date: '1944-06-22', title: 'Operation Bagration', theatre: 'eastern_front' },
  { date: '1944-07-20', title: 'July 20 Plot (Hitler)', theatre: 'eastern_front' },
  { date: '1944-08-25', title: 'Liberation of Paris', theatre: 'western_front' },
  { date: '1944-10-23', title: 'Battle of Leyte Gulf', theatre: 'pacific' },
  { date: '1944-12-16', title: 'Battle of the Bulge', theatre: 'western_front' },
  { date: '1945-01-12', title: 'Vistula-Oder Offensive', theatre: 'eastern_front' },
  { date: '1945-02-19', title: 'Battle of Iwo Jima', theatre: 'pacific' },
  { date: '1945-04-01', title: 'Battle of Okinawa', theatre: 'pacific' },
  { date: '1945-04-16', title: 'Battle of Berlin begins', theatre: 'eastern_front' },
  { date: '1945-04-30', title: 'Hitler dies', theatre: 'eastern_front' },
  { date: '1945-05-08', title: 'VE Day (Germany surrenders)' },
  { date: '1945-08-06', title: 'Hiroshima', theatre: 'pacific' },
  { date: '1945-08-09', title: 'Nagasaki', theatre: 'pacific' },
  { date: '1945-09-02', title: 'Japan surrenders (VJ Day)' },
];

export const THEATRE_COLORS: Record<string, string> = {
  eastern_front: '#cc0000',
  western_front: '#3366cc',
  pacific: '#cc9900',
  north_africa: '#cc9933',
  mediterranean: '#339966',
};

export const THEATRE_LABELS: Record<string, string> = {
  eastern_front: 'Eastern Front',
  western_front: 'Western Front',
  pacific: 'Pacific',
  north_africa: 'North Africa',
  mediterranean: 'Mediterranean',
};
