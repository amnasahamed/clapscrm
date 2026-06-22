import { BookOpen, GraduationCap, Layers } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import AdminCatalogList from '../../components/AdminCatalogList';

export default function AdminAcademicSection() {
  const {
    leads,
    grades,
    subjects,
    syllabi,
    addGrade,
    updateGrade,
    deleteGrade,
    addSubject,
    updateSubject,
    deleteSubject,
    addSyllabus,
    updateSyllabus,
    deleteSyllabus,
  } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-black text-[#18181b]">Academic catalog</h3>
        <p className="text-sm text-[#71717a] mt-1">
          Manage grade, subject, and syllabus options shown on the lead enquiry form.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AdminCatalogList
          title="Grades"
          subtitle="Class / grade options"
          icon={<GraduationCap size={20} />}
          iconClassName="bg-violet-50 text-violet-600"
          items={grades}
          onAdd={addGrade}
          onUpdate={updateGrade}
          onDelete={deleteGrade}
          getUsageCount={name => leads.filter(l => l.class === name).length}
          addLabel="Add Grade"
          placeholder="e.g. Class 13"
          deleteMessage={name => `Delete "${name}"? Leads using this grade will be moved to a fallback grade.`}
        />

        <AdminCatalogList
          title="Subjects"
          subtitle="Subject options"
          icon={<BookOpen size={20} />}
          iconClassName="bg-blue-50 text-blue-600"
          items={subjects}
          onAdd={addSubject}
          onUpdate={updateSubject}
          onDelete={deleteSubject}
          getUsageCount={name => leads.filter(l => l.subject === name).length}
          addLabel="Add Subject"
          placeholder="e.g. Economics"
          deleteMessage={name => `Delete "${name}"? Leads using this subject will be moved to a fallback subject.`}
        />

        <AdminCatalogList
          title="Syllabi"
          subtitle="Board / syllabus options"
          icon={<Layers size={20} />}
          iconClassName="bg-amber-50 text-amber-600"
          items={syllabi}
          onAdd={addSyllabus}
          onUpdate={updateSyllabus}
          onDelete={deleteSyllabus}
          getUsageCount={name => leads.filter(l => l.syllabus === name).length}
          addLabel="Add Syllabus"
          placeholder="e.g. NIOS"
          deleteMessage={name => `Delete "${name}"? Leads using this syllabus will be moved to a fallback.`}
        />
      </div>
    </div>
  );
}
