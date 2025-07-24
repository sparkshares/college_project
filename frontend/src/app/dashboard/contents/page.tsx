import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import ContentsTable from "@/components/ContentsTable";

const writtenDocs = [
	{ id: 1, title: "Meeting Notes", lastEdited: "2024-06-09" },
	{ id: 2, title: "Research Summary", lastEdited: "2024-06-07" },
	{ id: 3, title: "Personal Journal", lastEdited: "2024-06-03" },
];

const Contents = () => {
	return (
		<div className="p-8 bg-gray-50 min-h-screen">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
					<FileText className="text-green-500" size={22} /> My Documents
				</h2>
				<Link href="/dashboard/contents/write-content">
					<button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2">
						<Plus size={18} /> New Doc
					</button>
				</Link>
			</div>
			<ContentsTable docs={writtenDocs} />
		</div>
	);
};

export default Contents;