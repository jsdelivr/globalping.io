<template>
	<div class="flex flex-col gap-4 rounded-xl border p-6 shadow-xl max-md:p-4 max-md:shadow-md">
		<div class="flex flex-nowrap justify-evenly gap-1 overflow-x-auto rounded-xl max-lg:flex-col max-lg:overflow-visible">
			<button
				v-for="command in COMMAND_EXAMPLES"
				:key="command.key"
				class="rounded-xl border px-3.5 py-2 text-sm whitespace-nowrap"
				:class="{
					'bg-primary-50 border-primary-300 hover:border-primary-400 text-primary': command.title === selectedCommand.title,
					'bg-surface-100 hover:bg-surface-50 border-transparent': command.title !== selectedCommand.title
				}"
				:data-testid="`cli-quick-start-${command.key}`"
				@click="selectedCommand = command">
				{{command.title}}
			</button>
		</div>
		<pre ref="outputContainer" class="bg-surface-50 h-[25rem] overflow-auto rounded-xl p-4" data-testid="cli-quick-start-content">{{selectedCommand.output}}</pre>
	</div>
</template>

<script setup lang="ts">
	const COMMAND_EXAMPLES = [
		{
			key: 'ping',
			title: 'ping from Germany',
			output: '$ globalping ping jsdelivr.com from Germany --limit 2\n'
				+ '> EU, DE, Magdeburg, ASN:3209, Vodafone GmbH\n'
				+ 'PING  (172.67.213.229) 56(84) bytes of data.\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=1 ttl=57 time=19.6 ms\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=2 ttl=57 time=19.8 ms\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=3 ttl=57 time=17.0 ms\n'
				+ '\n'
				+ '---  ping statistics ---\n'
				+ '3 packets transmitted, 3 received, 0% packet loss, time 402ms\n'
				+ 'rtt min/avg/max/mdev = 17.049/18.791/19.774/1.235 ms\n'
				+ '\n'
				+ '> EU, DE, Nuremberg, ASN:51167, Contabo GmbH\n'
				+ 'PING  (172.67.213.229) 56(84) bytes of data.\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=1 ttl=58 time=4.05 ms\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=2 ttl=58 time=3.76 ms\n'
				+ '64 bytes from 172.67.213.229 (172.67.213.229): icmp_seq=3 ttl=58 time=3.88 ms\n'
				+ '\n'
				+ '---  ping statistics ---\n'
				+ '3 packets transmitted, 3 received, 0% packet loss, time 5227ms\n'
				+ 'rtt min/avg/max/mdev = 3.758/3.894/4.051/0.120 ms',
		},
		{
			key: 'traceroute',
			title: 'traceroute from a US state',
			output: '$ globalping traceroute jsdelivr.com from "North Carolina"\n'
				+ '> NA, US, (NC), Raleigh, ASN:11426, Charter Communications Inc\n'
				+ 'traceroute to jsdelivr.com (104.21.35.47), 20 hops max, 60 byte packets\n'
				+ ' 1  192.168.90.1 (192.168.90.1)  2.228 ms  0.154 ms\n'
				+ ' 2  mta-107-13-96-1.nc.rr.com (107.13.96.1)  10.675 ms  10.643 ms\n'
				+ ' 3  lag-59.rlghncks01h.netops.charter.com (174.111.105.176)  11.533 ms  11.506 ms\n'
				+ ' 4  lag-27.drhmncev02r.netops.charter.com (24.25.62.104)  11.542 ms  11.551 ms\n'
				+ ' 5  lag-31.rcr01drhmncev.netops.charter.com (24.93.64.184)  11.229 ms  11.318 ms\n'
				+ ' 6  lag-415.asbnva1611w-bcr00.netops.charter.com (107.14.18.106)  17.888 ms  17.941 ms\n'
				+ ' 7  lag-0.pr2.dca10.netops.charter.com (66.109.5.117)  17.340 ms  17.314 ms\n'
				+ ' 8  173.245.63.44 (173.245.63.44)  17.842 ms  17.818 ms\n'
				+ ' 9  172.70.40.3 (172.70.40.3)  43.735 ms  43.685 ms\n'
				+ '10  104.21.35.47 (104.21.35.47)  17.378 ms  17.353 ms',
		},
		{
			key: 'http',
			title: 'HTTP GET from AWS',
			output: '$ globalping http https://example.com from AWS --method GET\n'
				+ '> EU, DE, Frankfurt, ASN:16509, Amazon.com, Inc. (aws-eu-central-1)\n'
				+ '<!doctype html>\n'
				+ '<html>\n'
				+ '<head>\n'
				+ '    <title>Example Domain</title>\n'
				+ '\n'
				+ '    <meta charset="utf-8" />\n'
				+ '    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />\n'
				+ '    <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
				+ '    <style type="text/css">\n'
				+ '    body {\n'
				+ '        background-color: #f0f0f2;\n'
				+ '        margin: 0;\n'
				+ '        padding: 0;\n'
				+ '        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n'
				+ '\n'
				+ '    }\n'
				+ '    div {\n'
				+ '        width: 600px;\n'
				+ '        margin: 5em auto;\n'
				+ '        padding: 2em;\n'
				+ '        background-color: #fdfdff;\n'
				+ '        border-radius: 0.5em;\n'
				+ '        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);\n'
				+ '    }\n'
				+ '    a:link, a:visited {\n'
				+ '        color: #38488f;\n'
				+ '        text-decoration: none;\n'
				+ '    }\n'
				+ '    @media (max-width: 700px) {\n'
				+ '        div {\n'
				+ '            margin: 0 auto;\n'
				+ '            width: auto;\n'
				+ '        }\n'
				+ '    }\n'
				+ '    </style>\n'
				+ '</head>\n'
				+ '\n'
				+ '<body>\n'
				+ '<div>\n'
				+ '    <h1>Example Domain</h1>\n'
				+ '    <p>This domain is for use in illustrative examples in documents. You may use this\n'
				+ '    domain in literature without prior coordination or asking for permission.</p>\n'
				+ '    <p><a href="https://www.iana.org/domains/example">More information...</a></p>\n'
				+ '</div>\n'
				+ '</body>\n'
				+ '</html>',
		},
		{
			key: 'dns',
			title: 'resolve from Mumbai',
			output: '$ globalping dns cdn.jsdelivr.net from Mumbai\n'
				+ '> AS, IN, Mumbai, ASN:206216, Advin Services LLC\n'
				+ '; <<>> DiG 9.16.27-Debian <<>> cdn.jsdelivr.net -t A -p 53 -4 +timeout=3 +tries=2 +nocookie\n'
				+ ';; global options: +cmd\n'
				+ ';; Got answer:\n'
				+ ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30928\n'
				+ ';; flags: qr rd ra; QUERY: 1, ANSWER: 6, AUTHORITY: 0, ADDITIONAL: 1\n'
				+ '\n'
				+ ';; OPT PSEUDOSECTION:\n'
				+ '; EDNS: version: 0, flags:; udp: 512\n'
				+ ';; QUESTION SECTION:\n'
				+ ';cdn.jsdelivr.net.              IN      A\n'
				+ '\n'
				+ ';; ANSWER SECTION:\n'
				+ 'cdn.jsdelivr.net.       3161    IN      CNAME   cdn.jsdelivr.net.cdn.cloudflare.net.\n'
				+ 'cdn.jsdelivr.net.cdn.cloudflare.net. 90 IN A    104.16.88.20\n'
				+ 'cdn.jsdelivr.net.cdn.cloudflare.net. 90 IN A    104.16.85.20\n'
				+ 'cdn.jsdelivr.net.cdn.cloudflare.net. 90 IN A    104.16.87.20\n'
				+ 'cdn.jsdelivr.net.cdn.cloudflare.net. 90 IN A    104.16.86.20\n'
				+ 'cdn.jsdelivr.net.cdn.cloudflare.net. 90 IN A    104.16.89.20\n'
				+ '\n'
				+ ';; Query time: 4 msec\n'
				+ ';; SERVER: 8.8.8.8#53(8.8.8.8)\n'
				+ ';; WHEN: Mon Mar 27 15:24:04 UTC 2023\n'
				+ ';; MSG SIZE  rcvd: 171',
		},
		{
			key: 'mtr',
			title: 'MTR from gcp-europe-west3',
			output: '$ globalping mtr openai.com from gcp-europe-west3\n'
				+ '> EU, DE, Frankfurt, ASN:396982, Google LLC (gcp-europe-west3)\n'
				+ 'Host                                                             Loss% Drop Rcv Avg  StDev  Javg\n'
				+ ' 1. AS15169 _gateway (209.85.251.72)                              0.0%    0   3 1.4    0.4   1.0\n'
				+ ' 2. AS8075  ae65-0.fra-96cbe-1a.ntwk.msn.net (198.200.130.132)    0.0%    0   3 1.7    0.4   0.6\n'
				+ ' 3. AS8075  ae22-0.icr01.fra23.ntwk.msn.net (104.44.230.16)      33.3%    1   2 4.2    0.1   0.2\n'
				+ ' 4. AS8075  ae24-0.ier03.fra31.ntwk.msn.net (104.44.235.193)      0.0%    0   3 2.2    0.3   1.2\n'
				+ ' 5. AS???   (waiting for reply)\n'
				+ ' 6. AS8075  40.66.0.60 (40.66.0.60)                               0.0%    0   3 2.0    0.3   1.2\n'
				+ ' 7. AS???   (waiting for reply)\n'
				+ ' 8. AS???   (waiting for reply)\n'
				+ ' 9. AS???   (waiting for reply)\n'
				+ '10. AS8075  13.107.238.45 (13.107.238.45)                         0.0%    0   3 2.0    0.3   1.3',
		},
	];

	const selectedCommand = ref(COMMAND_EXAMPLES[0]!);
	const outputContainer = ref<HTMLElement>();

	watch(selectedCommand, () => {
		if (outputContainer.value) {
			outputContainer.value.scrollTop = 0;
		}
	});
</script>
