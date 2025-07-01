import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SMPost, WorkbenchSmpComponent } from './workbench-smp.component';

describe('WorkbenchSmpComponent', () => {
    let component: WorkbenchSmpComponent;
    let fixture: ComponentFixture<WorkbenchSmpComponent>;
    let mockLogger: any;

    beforeEach(async () => {
        mockLogger = { error: jasmine.createSpy('error') };

        await TestBed.configureTestingModule({
            declarations: [WorkbenchSmpComponent],
            providers: [{ provide: 'LoggerService', useValue: mockLogger }]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkbenchSmpComponent);
        component = fixture.componentInstance;
        // Inject mock logger if not through constructor
        (component as any).logger = mockLogger;
    });

    it('should segregate posts correctly based on provided input', () => {
        component.currentTab = 'inbox'; // uses "Mailbox" as skillKey and "SubChannel" as channelKey

        const mockPosts = [
            {
                Mailbox: 'SMMDevPageFB',
                AddedTime: '2025-06-30T13:20:13.873Z',
                SkillId: '49002',
                SkillName: 'SocialMedia_fb',
                SubChannel: 'facebook',
                PostData: {
                    SessionId: 'mmsm_x5Oxu0/+qkLdgC6zIoPg',
                    PostId: '258397014023582_122213018612246243',
                    ActiveCommentId: '122213018612246243_586794117815427',
                    From: 'Carol Mendonca',
                    RouteId: '',
                    To: 'SMMDevPageFB ',
                    Subject: 'r',
                    IsItemDeleted: false
                }
            }
        ];

        component.updateSegregatedPosts(mockPosts);

        expect(component.segregatedPosts).toEqual([
            {
                facebook: [
                    {
                        SMMDevPageFB: [
                            {
                                '258397014023582_122213018612246243': [mockPosts[0]]
                            }
                        ]
                    }
                ]
            }
        ]);
    });

    it('should call logger.error and not throw if PostData or keys are missing', () => {
        component.currentTab = 'inbox';

        const badInput: SMPost[] = [
            {
                Mailbox: 'SMMDevPageFB',
                AddedTime: '2025-06-30T13:20:13.873Z',
                SkillId: '49002',
                SkillName: 'SocialMedia_fb',
                SubChannel: 'facebook',
                PostData: {} as any
            }
        ];

        component.updateSegregatedPosts(badInput);

        expect(mockLogger.error).toHaveBeenCalled();
        expect(component.segregatedPosts).toEqual([]);
    });
});
